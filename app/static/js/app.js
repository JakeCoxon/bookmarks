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

  await htmx.ajax("POST", "/sidebar", {
    target: "#dynamicsidebar",
    swap: "morph",
    values: {
      ids: store.selectedIds,
    },
  });
  store.dynamicSidebarOpen = true;
};

document.addEventListener("customCssLoaded", () => {
  for (const el of document.querySelectorAll("[x-cloak]")) {
    el.removeAttribute("x-cloak");
  }
});

document.addEventListener("alpine:init", () => {
  Alpine.store("global", {
    selectedIds: [],
    dynamicSidebarOpen: false,
    isSelected(id) {
      return this.selectedIds.includes(id);
    },
    get anySelected() {
      return this.selectedIds.length > 0;
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

  document.body.addEventListener("click", async (event) => {
    if (isClickBody(event.target)) {
      if (store.selectedIds.length == 0) return;
      store.selectedIds = [];
      store.dynamicSidebarOpen = false;
    }
  });
});

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
  const result = Alpine.morph(el, text);
  return [result];
};

const swapBlocks = (target, fragment, blockId) => {
  const text = fragment.outerHTML;
  const blockEls = target.querySelectorAll(`[data-block-id="${blockId}"]`);
  const els = [];
  for (const el of blockEls) {
    els.push(Alpine.morph(el, text));
  }
  return els;
};
