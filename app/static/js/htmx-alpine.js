htmx.defineExtension("alpine-morph", {
  isInlineSwap: function (swapStyle) {
    return swapStyle === "morph";
  },
  handleSwap: function (swapStyle, target, fragment) {
    if (swapStyle === "morph") {
      const frag =
        fragment.nodeType === Node.DOCUMENT_FRAGMENT_NODE
          ? fragment.firstElementChild.outerHTML
          : fragment.nodeName === "BODY"
          ? fragment.firstElementChild.outerHTML
          : fragment.outerHTML;

      const result = Alpine.morph(target, frag);
      return [result];
    }
  },
});
