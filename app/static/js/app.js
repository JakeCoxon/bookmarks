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
    if (store.selectedIds.length === 1 && store.selectedIds[0] === blockId) return;
    store.selectedIds = [blockId];
  }

  htmx.ajax("POST", "/sidebar", {
    target: "#sidebar",
    swap: "morph",
    values: {
      ids: store.selectedIds,
    },
  });
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

  const text = await spartanJsonPost(`/create`, data);

  let el = document.querySelector("#added");
  const newEl = document.createElement("div");
  el.prepend(newEl);

  Alpine.morph(newEl, text);
};

htmx.defineExtension("bookmark-custom-swap", {
  isInlineSwap: function (swapStyle) {
    return swapStyle === "bookmarkCustomSwap";
  },
  handleSwap: function (swapStyle, target, fragment) {
    if (swapStyle === "bookmarkCustomSwap") {
      console.log("bookmarkCustomSwap", fragment);

      const frag = fragment.nodeName === "BODY" ? fragment.firstElementChild : fragment;
      const swapBlockId = frag.getAttribute("sx-swap-blocks");
      const swapTodayAttr = frag.getAttribute("sx-swap-today");
      if (typeof swapBlockId === "string") {
        return swapBlocks(target, frag, swapBlockId);
      } else if (typeof swapTodayAttr === "string") {
        return swapToday(target, frag);
      }
      throw new Error("Missing custom swap function");
    }
  },
});

const swapToday = (target, fragment) => {
  const text = fragment.outerHTML;
  const el = target.querySelector(`#group-day`) || target.querySelector(`#group-empty`);
  const promise = Alpine.morph(el, text);
  return { newElements: [target], promise };
};

const swapBlocks = (target, fragment, blockId) => {
  const text = fragment.outerHTML;
  const blockEls = target.querySelectorAll(`[data-block-id="${blockId}"]`);
  const promises = [];
  for (const el of blockEls) {
    promises.push(Alpine.morph(el, text));
  }
  const promise = Promise.all(promises);
  return { newElements: [target], promise };
};
