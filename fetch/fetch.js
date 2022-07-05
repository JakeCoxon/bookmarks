const createBrowserless = require("browserless");
const getHTML = require("html-get");

// Spawn Chromium process once
const browserlessFactory = createBrowserless();

// Kill the process when Node.js exit
process.on("exit", () => {
  browserlessFactory.close();
});

const withBrowser = async (func) => {
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
  require("metascraper-publisher")(),
  require("metascraper-title")(),
  require("metascraper-url")(),
  require("metascraper-instagram")(),
  require("metascraper-youtube")(),
]);

const urls = process.argv.slice(2);

withBrowser(async (getContent) => {
  const promises = [];
  for (const url of urls) {
    const func = async () => {
      const res = await getContent(url)
        .then(async ({ html, url }) => {
          const metadata = await metascraper({ html, url });
          return metadata;
        })
        .catch((error) => {
          return { error };
        });
      return res;
    };
    promises.push(func());
  }

  return Promise.all(promises);
}).then((data) => {
  console.log(JSON.stringify(data));
  process.exit();
});
