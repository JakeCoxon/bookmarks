let addBookmarkHtml = "";

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

  const text = await spartanJsonPost(`/sidebar`, { ids: store.selectedIds });
  let el = document.querySelector("#sidebar");

  Alpine.morph(el, text);
};

document.body.addEventListener("customCssLoaded", () => {
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
      let el = document.querySelector("#sidebar");

      Alpine.morph(el, addBookmarkHtml);
    }
  });
});

// Called via createForm
const addBookmark = async (form) => {
  const data = form.getData();

  const text = await spartanJsonPost(`/create`, data);

  let el = document.querySelector("#added");
  const newEl = document.createElement("div");
  el.prepend(newEl);

  Alpine.morph(newEl, text);
};

// Called via createForm
const saveBookmark = async (form) => {
  const data = form.getData();

  const text = await spartanJsonPost(`/save`, data);

  const blockEls = document.querySelectorAll(`[data-block-id="${data.id}"]`);
  for (const el of blockEls) {
    Alpine.morph(el, text);
  }

  // let el = document.querySelector("#added");
  // const newEl = document.createElement("div");
  // el.prepend(newEl);

  // Alpine.morph(newEl, text);
};
