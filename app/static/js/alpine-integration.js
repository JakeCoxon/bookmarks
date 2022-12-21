const sendErrorToast = `<div class="bg-chestnut-600 rounded px-4 py-4 mb-4 mr-6 flex items-center justify-center text-white shadow-lg cursor-pointer">Couldn't send request!</div>`;
const responseErrorToast = `<div class="bg-chestnut-600 rounded px-4 py-4 mb-4 mr-6 flex items-center justify-center text-white shadow-lg cursor-pointer">Something went wrong!</div>`;

document.addEventListener("alpine:init", () => {
  Alpine.store("requests", {
    numRequests: 0,
  });

  Alpine.store("toasts", createToastsHandler());

  Alpine.store("modal", createModalHandler());

  Alpine.directive("losefocus", (el, { expression }, { evaluateLater, cleanup }) => {
    const callback = evaluateLater(expression);

    const handler = (event) => {
      setTimeout(() => {
        if (!el.contains(document.activeElement)) callback();
      }, 0);
    };

    el.addEventListener("focusout", handler, true);

    cleanup(() => {
      el.removeEventListener("focusout", handler, true);
    });
  });
});

document.addEventListener("htmx:sendError", (evt) => {
  const toasts = Alpine.store("toasts");
  toasts.add({ html: sendErrorToast });
});

document.addEventListener("htmx:responseError", (evt) => {
  const toasts = Alpine.store("toasts");
  toasts.add({ html: responseErrorToast });
});

document.addEventListener("htmx:beforeRequest", (evt) => {
  const requests = Alpine.store("requests");
  requests.numRequests++;
});

document.addEventListener("htmx:afterRequest", (evt) => {
  const requests = Alpine.store("requests");
  requests.numRequests--;
});

document.addEventListener("showToasts", (evt) => {
  if (!Array.isArray(evt.detail.value)) return;
  const toasts = Alpine.store("toasts");
  evt.detail.value.forEach((html) => {
    toasts.add({ html });
  });
});

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
      async ["@submit"](ev) {
        // Nothing for now
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

const createModalHandler = () => {
  return {
    showModal: false,
    modalKey: null,
    modalElement: null,
    init() {
      document.addEventListener("htmx:pushedIntoHistory", () => {
        this.showModal = false;
      });
      document.addEventListener("htmx:replacedInHistory", () => {
        this.showModal = false;
      });
    },
    openModal() {
      if (this.showModal) return;
      this.showModal = true;
      this.modalKey = String(Date.now());
    },
    closeModal() {
      this.showModal = false;
      this.modalKey = null;
    },
  };
};

function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

const createTagHandler = (initial, requestUrl) => {
  const doRefetch = debounce((f) => f(), 300);

  return {
    tags: initial,
    requestUrl,
    showAutoComplete: false,
    tagInput: "",
    lastRequestInput: undefined,
    remove(tag) {
      this.tags = this.tags.filter((x) => x !== tag);
    },
    add(tag) {
      this.tags.push(tag);
      this.tagInput = "";
    },
    addFromInput() {
      if (!this.tagInput.length) return;
      if (this.tags.includes(this.tagInput)) return;
      this.tags.push(this.tagInput);
      this.tagInput = "";
    },
    container: {
      ["x-on:keydown.escape"]() {
        if (this.showAutoComplete) {
          this.showAutoComplete = false;
          this.$event.stopPropagation();
        }
      },
      ["x-on:click.away"]() {
        this.showAutoComplete = false;
        this.addFromInput();
      },
      ["x-losefocus"]() {
        this.showAutoComplete = false;
        this.addFromInput();
      },
    },
    refetch() {
      doRefetch(async () => {
        const input = this.tagInput;
        if (this.lastRequestInput === input) return;
        const target = this.$refs.autoComplete.firstElementChild;
        await htmx.ajax("POST", this.requestUrl, {
          target: target,
          swap: "morph",
          values: {
            input: input,
            tags: this.tags,
          },
        });
        this.lastRequestInput = input;
      });
    },
    autoComplete: {
      "x-ref": "autoComplete",
    },
    textInput: {
      "x-model": "tagInput",
      ["x-on:keydown.enter"]() {
        this.$event.preventDefault();
        this.addFromInput();
      },
      ["x-on:click"]() {
        this.showAutoComplete = true;
        this.refetch();
      },
      ["x-on:keypress"]() {
        this.showAutoComplete = true;
        this.refetch();
      },
      ["x-on:focus"]() {
        this.showAutoComplete = true;
        this.refetch();
      },
    },
  };
};

const customMorphSettings = {
  updating(el, toEl, childrenOnly, skip) {
    if (toEl.getAttribute && toEl.getAttribute("x-skip-morph") !== null) {
      skip();
    }
  },
};

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

      const result = Alpine.morph(target, frag, customMorphSettings);
      return [result];
    }
  },
});
