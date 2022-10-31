const createBrowserless = require("browserless");
const getHTML = require("html-get");
const fetch = require("node-fetch");

// Spawn Chromium process once
const browserlessFactory = createBrowserless();

// Kill the process when Node.js exit
process.on("exit", () => {
  browserlessFactory.close();
});

const withContext = async (func) => {
  // const getContent = (url) =>
  //   fetch(url)
  //     .then((x) => x.text())
  //     .then((html) => ({ url, html }));

  // return func(getContent);

  // create a browser context inside Chromium process
  const browserContext = browserlessFactory.createContext();
  const getBrowserless = () => browserContext;
  const getContent = (url) => {
    return getHTML(url, { getBrowserless });
  };
  const res = await func(getContent);
  // close the browser context after it's used
  await getBrowserless((browser) => browser.destroyContext());
  return res;
};

const metascraper = require("metascraper")([
  require("metascraper-author")(),
  require("metascraper-date")(),
  require("metascraper-description")(),
  require("metascraper-image")(),
  require("metascraper-logo")(),
  require("metascraper-clearbit")(),
  require("metascraper-logo-favicon")(),
  require("metascraper-publisher")(),
  require("metascraper-title")(),
  require("metascraper-url")(),
  require("metascraper-instagram")(),
  require("metascraper-youtube")(),
]);

const urls = process.argv.slice(2);

const replaceHostnames = {
  "instagram.com": "imginn.com", // alternative bibliogram.art
  "www.instagram.com": "imginn.com",
  "twitter.com": "nitter.net",
  "mobile.twitter.com": "nitter.net",
  // https://invidious.io/
  // https://teddit.net/
};

const replaceUrl = ({ originalUrl, responseMetadata }) => {
  if (responseMetadata.error) return;

  if (!originalUrl) return;

  if (responseMetadata.url == "https://www.instagram.com/accounts/login/") {
    const urlObj = new URL(originalUrl);
    if (originalUrl.includes("/tv/") || originalUrl.includes("/reel/")) {
      urlObj.hostname = "bibliogram.art";
      console.error(
        `Trying to manipulate url ${originalUrl} with ${urlObj.href}`
      );
      return urlObj.href;
    } else {
      urlObj.hostname = "imginn.com";
      console.error(
        `Trying to manipulate url ${originalUrl} with ${urlObj.href}`
      );
      return urlObj.href;
    }
  }

  if (responseMetadata.description) return; // assume this was ok
  console.error("Trying to manip ", responseMetadata);

  const urlObj = new URL(responseMetadata.url);
  if (replaceHostnames[urlObj.hostname]) {
    urlObj.hostname = replaceHostnames[urlObj.hostname];
    console.error(
      `Trying to manipulate url ${responseMetadata.url} with ${urlObj.href}`
    );
    return urlObj.href;
  }
};

const promises = [];
for (let url of urls) {
  const func = () =>
    withContext(async (getContent) => {
      const checkAlternative = async (previousRes) => {
        // if (previousRes.url && !previousRes.description) {
        try {
          const newUrl = replaceUrl({
            originalUrl: url,
            responseMetadata: previousRes,
          });

          if (newUrl) {
            return await getContent(newUrl)
              .then(({ html, url }) => metascraper({ html, url }))
              .catch((error) => ({ error }));
          }
        } catch (ex) {
          console.error(ex);
        }
        // }

        return previousRes;
      };

      const res = await getContent(url)
        .then(({ html, url }) => metascraper({ html, url }))
        .catch((error) => {
          console.error(url, error);
          return { error };
        });

      return checkAlternative(res);
    });

  promises.push(func());
}

Promise.all(promises).then((data) => {
  console.log(JSON.stringify(data));
  process.exit();
});
