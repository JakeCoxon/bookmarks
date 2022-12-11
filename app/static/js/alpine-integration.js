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

const errorToast = `<div class="bg-chestnut-600 rounded px-4 py-4 mb-4 mr-6 flex items-center justify-center text-white shadow-lg cursor-pointer">Something went wrong!</div>`;

const spartanJsonPost = async (url, data) => {
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
    if (!response.ok) {
      throw new Error("Request failed");
    }
  } catch (ex) {
    console.error(ex);
    const toasts = Alpine.store("toasts");
    toasts.add({ html: errorToast });
    throw ex;
  } finally {
    requests.numRequests--;
  }
  handleToastsFromResponse(response);

  return text;
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
