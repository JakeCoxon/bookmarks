const clickBookmark = async (event, blockId) => {
  const store = Alpine.store("global");
  if (event.metaKey) {
    store.selectedIds.push(blockId);
  } else {
    store.selectedIds = [blockId];
  }

  const text = await fetch(`/sidebar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids: store.selectedIds }),
  }).then((x) => x.text());
  let el = document.querySelector("#sidebar");

  Alpine.morph(el, text);
};

document.addEventListener("alpine:init", () => {
  Alpine.store("global", {
    selectedIds: [],
    isSelected(id) {
      return this.selectedIds.includes(id);
    },
  });
  const store = Alpine.store("global");

  const isClickBody = (el) => {
    while (el) {
      if (el.tagName == "INPUT") return false;
      if (el.tagName == "TEXTAREA") return false;
      if (el.tagName == "BUTTON") return false;
      if (el.dataset.blockId) return false;
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

      Alpine.morph(
        el,
        `
      
      <div x-data class="rightnav" id="sidebar">

          <button>
            Home
          </button>

        </div>
        `
      );
    }
  });
});

const createAddBookmarkModel = (collection_id) => {
  const addBookmark = async (model) => {
    const { url, title, desc } = model;

    const text = await fetch(`/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, title, desc, collection_id }),
    }).then((x) => x.text());

    let el = document.querySelector("#added");
    const newEl = document.createElement("div");
    el.prepend(newEl);

    Alpine.morph(newEl, text);
  };

  return {
    url: "",
    title: "",
    desc: "",
    focus: false,

    clear() {
      Object.assign(this, { url: "", title: "", desc: "" });
    },

    container: {
      [":class"]() {
        return this.focus ? "urlcontainer--active" : "";
      },
      ["@focusin"]() {
        this.focus = true;
      },
      ["@focusout"]() {
        this.focus = false;
      },
    },

    urlInput: {
      ["@keyup.enter"]() {
        addBookmark(this);
        this.clear();
      },
    },

    trigger: {
      ["@click"]() {
        addBookmark(this);
        this.clear();
      },
    },
  };
};

const saveBookmark = async (model) => {
  const { id, url, title, desc } = model;

  const text = await fetch(`/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id, url, title, desc }),
  }).then((x) => x.text());

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
