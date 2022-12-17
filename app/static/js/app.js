const clickBookmark = async (event, collectionId, blockId) => {
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

  await htmx.ajax("POST", `/collection/${collectionId}/sidebar`, {
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

const myGlobal = this;

htmx.defineExtension("bookmark-custom-swap", {
  isInlineSwap: function (swapStyle) {
    return swapStyle === "bookmarkCustomSwap";
  },
  handleSwap: function (swapStyle, target, fragment) {
    if (swapStyle === "bookmarkCustomSwap") {
      console.log("bookmarkCustomSwap", fragment);

      const frag = fragment.nodeName === "BODY" ? fragment.firstElementChild : fragment;
      const targetResponse = frag.getAttribute("sx-target-response");
      const custom = frag.getAttribute("sx-custom");
      const swapBlockId = frag.getAttribute("sx-swap-blocks");
      const swapTodayAttr = frag.getAttribute("sx-swap-today");
      if (typeof swapBlockId === "string") {
        return swapBlocks(target, frag, swapBlockId);
      } else if (typeof swapTodayAttr === "string") {
        return swapToday(target, frag);
      } else if (typeof targetResponse === "string") {
        return swapTarget(target, targetResponse, frag);
      } else if (typeof custom === "string") {
        const func = eval(custom);
        if (!func) throw new Error(`Missing function '${custom}'`);
        return func(target, frag);
      }
      throw new Error("Missing custom swap function");
    }
  },
});

const openModal = (elt, fragment) => {
  const text = fragment.outerHTML;
  const modal = Alpine.store("modal");
  const target = modal.$el.querySelector("#modal-content");
  if (!target) throw new Error(`Missing modal element`);
  const result = Alpine.morph(target, text, customMorphSettings);
  result.setAttribute("id", "modal-content");
  modal.showModal = true;
  return [result];
};

const swapTarget = (parent, targetSelector, fragment) => {
  const text = fragment.outerHTML;
  const target = document.querySelector(targetSelector);
  if (!target) throw new Error(`Missing target '${targetSelector}'`);
  const result = Alpine.morph(target, text, customMorphSettings);
  return [result];
};

const swapToday = (target, fragment) => {
  const text = fragment.outerHTML;
  const el = target.querySelector(`#group-day`) || target.querySelector(`#group-empty`);
  const result = Alpine.morph(el, text, customMorphSettings);
  return [result];
};

const swapBlocks = (target, fragment, blockId) => {
  const text = fragment.outerHTML;
  const blockEls = target.querySelectorAll(`[data-block-id="${blockId}"]`);
  const els = [];
  for (const el of blockEls) {
    els.push(Alpine.morph(el, text, customMorphSettings));
  }
  return els;
};
