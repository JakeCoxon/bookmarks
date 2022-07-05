import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createStore } from "./pureStore";
import "./styles.css";
import { useEvent } from "./useEvent";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Routes,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import ReactModal from "react-modal";

const fakeData = () => ({
  blocks: {
    bl_3: {
      id: "bl_3",
      contents: "",
      reference_id: "pg_2",
      ancestor_page_id: "pg_1",
      first_child_id: null,
      next_sibling_id: "bl_5",
      parent_block_id: null,
    },
    bl_5: {
      id: "bl_5",
      contents: "",
      reference_id: "pg_4",
      ancestor_page_id: "pg_1",
      first_child_id: null,
      next_sibling_id: "bl_7",
      parent_block_id: null,
    },
    bl_7: {
      id: "bl_7",
      contents: "",
      reference_id: "pg_6",
      ancestor_page_id: "pg_1",
      first_child_id: null,
      next_sibling_id: "bl_8",
      parent_block_id: null,
    },
    bl_8: {
      id: "bl_8",
      contents: "Cool",
      reference_id: null,
      ancestor_page_id: "pg_1",
      first_child_id: null,
      next_sibling_id: "bl_9",
      parent_block_id: null,
    },
    bl_9: {
      id: "bl_9",
      contents: "Cool",
      reference_id: "bk_1",
      ancestor_page_id: "pg_1",
      first_child_id: null,
      next_sibling_id: null,
      parent_block_id: null,
    },
  },
  pages: {
    pg_1: {
      id: "pg_1",
      title: "Home page",
      first_child_id: "bl_3",
      parent_page_id: null,
    },
    pg_2: {
      id: "pg_2",
      title: "Sub page 1",
      first_child_id: null,
      parent_page_id: null,
    },
    pg_4: {
      id: "pg_4",
      title: "Sub page 2",
      first_child_id: null,
      parent_page_id: null,
    },
    pg_6: {
      id: "pg_6",
      title: "Sub page 3",
      first_child_id: null,
      parent_page_id: null,
    },
  },
  bookmarks: {
    bk_1: {
      id: "bk_1",
      url: "http://cool.com",
      title: "cool bookmark",
      description: "here",
    },
  },
});

ReactModal.setAppElement(document.querySelector("#root"));

const store = createStore({
  data: null,
  pageId: "pg_1",
  selectedIds: [],
});

const makeFetch = (id) => {
  return fetch(`http://0.0.0.0:8080/page/${id}/api`)
    .then((x) => x.json())
    .then((data) => {
      store.update({ data });
    });
};
// makeFetch(store.state.pageId);

const makeEdits = (edits) => {
  return fetch("http://0.0.0.0:8080/edit", {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(edits),
  })
    .then((x) => x.json())
    .then((data) => {
      return makeFetch(store.state.pageId).then((x) => data);
    });
};

document.addEventListener("mousedown", () => {
  store.update({ selectedIds: [] });
});

export default function App() {
  return (
    <Router>
      <AppContents />
    </Router>
  );
}
function AppContents() {
  const location = useLocation();

  let state = location.state;

  return (
    <>
      <div className="App">
        <div className="sidebar">sidebar</div>
        <div
          className="main"
          onKeyDownCapture={(ev) => {
            if (state?.backgroundLocation) {
              ev.stopPropagation();
            }
          }}
        >
          <Routes location={state?.backgroundLocation || location}>
            <Route path=":pageId" element={<Page />} />
          </Routes>
        </div>
      </div>

      {state?.backgroundLocation && (
        <Routes>
          <Route path="/edit/:pageId/:blockId" element={<EditModal />} />
        </Routes>
      )}
    </>
  );
}

const EditModal = ({}) => {
  const { pageId, blockId } = useParams();
  const [text, setText] = useState(() => {
    return store.state.data?.blocks[blockId].contents;
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!store.state.data) {
      navigate(`/${pageId}`);
    }
  }, []);

  const events = {
    onChange: (ev) => setText(ev.target.value),
    onKeyDown: (ev) => {
      if (ev.key == "Enter" && ev.metaKey) {
        makeEdits([{ type: "edit_block", block_id: blockId, contents: text }]);
        navigate(-1);
      }
    },
  };

  return (
    <ReactModal
      isOpen={true}
      onRequestClose={() => {
        navigate(-1);
      }}
    >
      <textarea
        className="editbox"
        value={text}
        {...events}
        autoFocus={true}
      ></textarea>
    </ReactModal>
  );
};

const Page = ({}) => {
  let { pageId } = useParams();
  const data = store.useValue((x) => x.data);
  useEffect(() => {
    store.update({ pageId });
    makeFetch(pageId);
  }, [pageId]);

  return (
    <div className="page">{data ? <RenderPage pageId={pageId} /> : null}</div>
  );
};

const RenderPage = ({ pageId }) => {
  const page = store.useValue((x) => x.data.pages[pageId]);

  const data = store.useValue((x) => x.data);
  const navigate = useNavigate();
  const location = useLocation();

  const blocks = useMemo(() => {
    const blocks = [];

    const addBlock = (id, indent = 0) => {
      const b = data.blocks[id];
      if (!b) return;
      blocks.push({ block: b, indent });
      if (b.first_child_id) {
        addBlock(b.first_child_id, indent + 1);
      }
      if (b.next_sibling_id) {
        addBlock(b.next_sibling_id, indent);
      }
    };
    if (page.first_child_id) {
      addBlock(page.first_child_id);
    }
    return blocks;
  }, [data]);

  const keyEvent = useEvent((ev) => {
    if (ev.key == "ArrowUp" && ev.altKey) {
      const id = store.state.selectedIds[0];
      if (!id) return;
      const prevId = blocks.find((x) => x.block.next_sibling_id == id)?.block
        .id;
      const prevPrevId =
        prevId &&
        blocks.find((x) => x.block.next_sibling_id == prevId)?.block.id;
      if (prevPrevId) {
        makeEdits([
          {
            type: "move_after",
            block_id: id,
            after_id: prevPrevId,
          },
        ]);
      } else {
        makeEdits([
          {
            type: "move_to_top",
            block_id: id,
          },
        ]);
      }
    } else if (ev.key == "ArrowDown" && ev.altKey) {
      const id = store.state.selectedIds[0];
      if (!id) return;
      const nextId = data.blocks[id].next_sibling_id;
      if (nextId) {
        makeEdits([
          {
            type: "move_after",
            block_id: id,
            after_id: nextId,
          },
        ]);
      }
    } else if (ev.key == "Enter" && ev.metaKey) {
      const id = store.state.selectedIds[0];
      if (!id) return;
      makeEdits([
        { type: "add_block", page_id: pageId, contents: "new block" },
        {
          type: "move_after",
          after_id: id,
        },
      ]).then((response) => {
        store.update({ selectedIds: [response.block_id] });
      });

      ev.stopPropagation();
      ev.preventDefault();
    } else if (ev.key == "Delete") {
      const ids = store.state.selectedIds;
      const prevId = blocks.find((x) => ids.includes(x.block.next_sibling_id))
        ?.block.id;
      store.update({ selectedIds: prevId ? [prevId] : [] });
      makeEdits([{ type: "delete_blocks", page_id: pageId, block_ids: ids }]);
      ev.stopPropagation();
      ev.preventDefault();
    } else if (ev.key == "Enter") {
      const id = store.state.selectedIds[0];
      if (data.blocks[id].reference_id?.startsWith("pg_")) {
        navigate(`/${data.blocks[id].reference_id}`);
      } else {
        navigate(`/edit/${pageId}/${id}`, {
          state: {
            backgroundLocation: location,
          },
        });
      }
      ev.stopPropagation();
      ev.preventDefault();
    } else if (ev.key == "ArrowUp") {
      const id = store.state.selectedIds[0];
      if (!id) return;
      const prevId = blocks.find((x) => x.block.next_sibling_id == id)?.block
        .id;
      if (prevId) {
        store.update({ selectedIds: [prevId] });
      }
    } else if (ev.key == "ArrowDown") {
      const id = store.state.selectedIds[0];
      const nextId = id ? data.blocks[id].next_sibling_id : page.first_child_id;
      if (nextId) {
        store.update({ selectedIds: [nextId] });
      }
    }
    // console.log(ev.key);
  });

  useEffect(() => {
    if (page) divRef.current?.focus();
  }, [page]);

  const divRef = useRef();
  if (!page) return;

  return (
    <div
      onKeyDownCapture={keyEvent}
      tabIndex={0}
      style={{ padding: 10 }}
      autoFocus={true}
      onFocusCapture={(ev) => divRef.current.focus()}
      onClickCapture={(ev) => divRef.current.focus()}
      ref={divRef}
    >
      <div>
        <h1>{page.title}</h1>
        {/* <Text id={id} /> */}
      </div>
      <div>
        <button
          onClick={() =>
            makeEdits([
              { type: "add_block", page_id: pageId, contents: "new block" },
              { type: "move_to_top" },
            ])
          }
        >
          Add block
        </button>
      </div>
      {blocks.map(({ block, indent }) => {
        return <BlockContainer key={block.id} block={block} indent={indent} />;
      })}
    </div>
  );
};

const BlockContainer = React.memo(({ block, indent }) => {
  return (
    <div style={{ marginLeft: indent * 50 }}>
      {block.reference_id && block.reference_id.startsWith("pg_") ? (
        <PageLink id={block.id} />
      ) : block.reference_id && block.reference_id.startsWith("bk_") ? (
        <Bookmark id={block.id} />
      ) : (
        <Text id={block.id} />
      )}
    </div>
  );
});

const Block = ({ children, id, type }) => {
  const selected = store.useValue((x) => x.selectedIds.includes(id));
  const events = {
    onMouseDown: (ev) => {
      store.update((draft) => {
        if (ev.shiftKey) {
          draft.selectedIds.push(id);
        } else {
          draft.selectedIds = [id];
        }
      });
      ev.preventDefault();
      ev.stopPropagation();
    },
  };
  return (
    <div
      className={`block block-${type} ${selected ? "block-selected" : ""}`}
      {...events}
    >
      {children}
    </div>
  );
};

const Bookmark = React.memo(({ id }) => {
  const block = store.useValue((x) => x.data.blocks[id]);
  const bookmark = store.useValue((x) => x.data.bookmarks[block.reference_id]);

  return (
    <Block id={id} type="bookmark">
      <div className="block-bookmark--left">
        <div className="block-bookmark--title">
          <strong>{bookmark.title}</strong>
        </div>
        <div className="block-bookmark--description">
          {bookmark.description}
        </div>
        <div className="block-bookmark--bottom">
          {bookmark.logo ? <img src={bookmark.logo} /> : null}
          <a href={bookmark.url}>{bookmark.url}</a>
        </div>
      </div>

      {bookmark.image ? (
        <div className="block-bookmark--right">
          <img src={bookmark.image} />
        </div>
      ) : null}
    </Block>
  );
});

const Text = React.memo(({ id }) => {
  const block = store.useValue((x) => x.data.blocks[id]);

  return (
    <Block id={id} type="text">
      {block.contents}
    </Block>
  );
});

const PageLink = React.memo(({ id }) => {
  const block = store.useValue((x) => x.data.blocks[id]);
  const page = store.useValue((x) => x.data.pages[block.reference_id]);

  return (
    <Block id={id} type="page">
      <Link to={`/${page.id}`}>{page.title}</Link>
    </Block>
  );
});
