let addBookmarkHtml = "";

const sendErrorToast = `<div class="bg-chestnut-600 rounded px-4 py-4 mb-4 mr-6 flex items-center justify-center text-white shadow-lg cursor-pointer">Couldn't send request!</div>`;
const responseErrorToast = `<div class="bg-chestnut-600 rounded px-4 py-4 mb-4 mr-6 flex items-center justify-center text-white shadow-lg cursor-pointer">Something went wrong!</div>`;

document.addEventListener("htmx:sendError", (evt) => {
  const toasts = Alpine.store("toasts");
  toasts.add({ html: sendErrorToast });
});

document.addEventListener("htmx:responseError", (evt) => {
  const toasts = Alpine.store("toasts");
  toasts.add({ html: responseErrorToast });
});

document.addEventListener("htmx:beforeRequest", (evt) => {
  console.log("Before request");
  const requests = Alpine.store("requests");
  requests.numRequests++;
});

document.addEventListener("htmx:afterRequest", (evt) => {
  console.log("After request");
  const requests = Alpine.store("requests");
  requests.numRequests--;
});

document.addEventListener("htmx:historyRestore", (evt) => {
  const els = document.querySelectorAll("[x-data]");
  debugger;
  for (const el of els) {
  }
  console.log("restore");
});

document.addEventListener("showToasts", (evt) => {
  if (!Array.isArray(evt.detail.value)) return;
  const toasts = Alpine.store("toasts");
  evt.detail.value.forEach((html) => {
    toasts.add({ html });
  });
});

const clickBookmark = async (event, blockId) => {
  const store = Alpine.store("global");

  if (event.metaKey) {
    if (store.selectedIds.includes(blockId)) {
      store.selectedIds = store.selectedIds.filter((x) => x !== blockId);
    } else {
      store.selectedIds.push(blockId);
    }
  } else {
    if (store.selectedIds.includes(blockId)) return;
    store.selectedIds = [blockId];
  }

  htmx.ajax("POST", "/sidebar", {
    target: "#sidebar",
    swap: "morph",
    values: {
      ids: store.selectedIds,
    },
  });
  // const text = await hxRequest(`/sidebar`, { ids: store.selectedIds });
  // let el = document.querySelector("#sidebar");

  // Alpine.morph(el, text);
};

document.addEventListener("customCssLoaded", () => {
  for (const el of document.querySelectorAll("[x-cloak]")) {
    el.removeAttribute("x-cloak");
  }
});

document.addEventListener("alpine:init", () => {
  const sidebar = document.querySelector("#sidebar");
  if (sidebar) {
    addBookmarkHtml = sidebar.outerHTML;
  }

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
      if (el.tagName == "A") return false;
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
      console.log("Deselect");
      let el = document.querySelector("#sidebar");
      Alpine.morph(el, addBookmarkHtml);
    }
  });
});

// Called via createForm
const addBookmark = async (form) => {
  const data = form.getData();

  const text = await hxRequest(`/create`, data);

  let el = document.querySelector("#added");
  const newEl = document.createElement("div");
  el.prepend(newEl);

  Alpine.morph(newEl, text);
};

// Called via createForm
const saveBookmark = async (form) => {
  const r = await htmx.ajax("POST", "/save", {
    values: form.getData(),
    swap: "none",
    // handler: (...args) => {
    //   // debugger;
    //   // const blockEls = document.querySelectorAll(`[data-block-id="${data.id}"]`);
    //   // for (const el of blockEls) {
    //   //   Alpine.morph(el, text);
    //   // }
    // },
  });
  console.log(r);
  // const text = await hxRequest(`/save`, data);

  // let el = document.querySelector("#added");
  // const newEl = document.createElement("div");
  // el.prepend(newEl);

  // Alpine.morph(newEl, text);
};

const createForm = ({ initialValues, onSubmit }) => {
  return {
    initialValues,
    ...initialValues,
    onSubmit,
    isSubmitting: false,

    getData() {
      const data = {};
      Object.keys(this.initialValues).forEach((k) => (data[k] = this[k]));
      return data;
    },

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
