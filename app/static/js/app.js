let addBookmarkHtml = "";

const handleToastsFromResponse = (response) => {
  const triggerJson = response.headers.get("HX-Trigger");
  if (!triggerJson) return;

  const trigger = JSON.parse(triggerJson);
  Object.entries(trigger).forEach(([name, value]) => {
    const toasts = Alpine.store("toasts");
    value.forEach((html) => {
      toasts.add({ html });
    });
  });
};

const hxRequest = async (url, data) => {
  let text, response;
  const requests = Alpine.store("requests");
  requests.numRequests++;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "HX-Request": "true",
      },
      body: JSON.stringify(data),
    });
    text = await response.text();
  } catch (ex) {
    console.error(ex);
    const toasts = Alpine.store("toasts");
    toasts.add("Could not make request");
    throw ex;
  } finally {
    requests.numRequests--;
  }
  handleToastsFromResponse(response);

  return text;
};

const clickBookmark = async (event, blockId) => {
  const store = Alpine.store("global");
  if (event.metaKey) {
    store.selectedIds.push(blockId);
  } else {
    store.selectedIds = [blockId];
  }

  const text = await hxRequest(`/sidebar`, { ids: store.selectedIds });
  let el = document.querySelector("#sidebar");

  Alpine.morph(el, text);
};

document.body.addEventListener("customCssLoaded", () => {
  for (const el of document.querySelectorAll("[x-cloak]")) {
    console.log(el);
    el.removeAttribute("x-cloak");
  }
});

document.addEventListener("alpine:init", () => {
  addBookmarkHtml = document.querySelector("#sidebar").outerHTML;

  Alpine.store("global", {
    selectedIds: [],
    isSelected(id) {
      return this.selectedIds.includes(id);
    },
  });

  Alpine.store("requests", {
    numRequests: 0,
  });

  Alpine.store("toasts", createToastsHandler());

  const store = Alpine.store("global");

  const isClickBody = (el) => {
    while (el) {
      if (el.tagName == "INPUT") return false;
      if (el.tagName == "TEXTAREA") return false;
      if (el.tagName == "BUTTON") return false;
      if (el.dataset.blockId) return false;
      if ("noClickThrough" in el.dataset) return false;
      if (el.tagName == "BODY") return true;
      el = el.parentElement;
    }
    return true;
  };

  document.body.addEventListener("click", (event) => {
    if (isClickBody(event.target)) {
      if (store.selectedIds.length == 0) return;

      store.selectedIds = [];
      let el = document.querySelector("#sidebar");

      Alpine.morph(el, addBookmarkHtml);
    }
  });
});

// Called via createForm
const addBookmark = async (model) => {
  const { url, title, desc, collection_id } = model;

  const text = await hxRequest(`/create`, { url, title, desc, collection_id });

  let el = document.querySelector("#added");
  const newEl = document.createElement("div");
  el.prepend(newEl);

  Alpine.morph(newEl, text);
};

// Called via createForm
const saveBookmark = async (model) => {
  const { id, url, title, desc } = model;

  const text = await hxRequest(`/save`, { id, url, title, desc });

  const blockEls = document.querySelectorAll(`[data-block-id="${id}"]`);
  for (const el of blockEls) {
    Alpine.morph(el, text);
  }

  // let el = document.querySelector("#added");
  // const newEl = document.createElement("div");
  // el.prepend(newEl);

  // Alpine.morph(newEl, text);
};

const createForm = (initialValues) => {
  return {
    ...initialValues,
    isSubmitting: false,

    form: {
      async ["@submit.prevent"]() {
        this.isSubmitting = true;
        try {
          await this.onSubmit(this);
        } finally {
          this.isSubmitting = false;
        }
      },
    },

    trigger: {
      [":disabled"]() {
        return this.isSubmitting;
      },
    },
  };
};

const createToastsHandler = () => {
  let unique = 0;
  return {
    notices: [],
    visible: [],
    add(notice) {
      notice.id = unique++;
      this.notices.push(notice);
      this.fire(notice.id);
    },
    fire(id) {
      this.visible.push(this.notices.find((notice) => notice.id == id));
      const timeShown = 2000 * this.visible.length;
      setTimeout(() => this.remove(id), timeShown);
    },
    remove(id) {
      const index = this.visible.findIndex((notice) => notice.id == id);
      if (index > -1) this.visible.splice(index, 1);
      setTimeout(() => {
        const index = this.notices.findIndex((notice) => notice.id == id);
        this.notices.splice(index, 1);
      });
    },
  };
};
