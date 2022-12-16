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
