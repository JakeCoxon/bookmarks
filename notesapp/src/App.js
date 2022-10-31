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
        <Sidebar />
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
const Sidebar = () => {
  const sidebarIds = store.useValue((x) => x.data?.sidebar);
  const pages = store.useValue((x) => x.data?.pages);

  return (
    <div className="sidebar">
      {(sidebarIds || []).map((id) => (
        <div>
          <Link to={`/${pages[id].id}`}>{pages[id].title}</Link>
        </div>
      ))}
    </div>
  );
};

const EditModal = ({}) => {
  const { pageId, blockId } = useParams();
  const [block, setBlock] = useState(() => {
    return store.state.data?.blocks[blockId];
  });
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

  const bookmark =
    store.state?.data && block?.reference_id?.startsWith("bk_")
      ? store.state.data.bookmarks[block.reference_id]
      : null;

  return (
    <ReactModal
      isOpen={true}
      onRequestClose={() => {
        navigate(-1);
      }}
    >
      {bookmark ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <input type="text" value={bookmark.url} />
          <input type="text" value={bookmark.title} />
          <input type="text" value={bookmark.image} />
          <input type="text" value={bookmark.logo} />
          <textarea className="editbox" value={bookmark.description}></textarea>
          <textarea className="editbox" value={bookmark.caption}></textarea>
          {/* <pre>{JSON.stringify(bookmark, null, 2)}</pre> */}
        </div>
      ) : (
        <textarea
          className="editbox"
          value={text}
          {...events}
          autoFocus={true}
        ></textarea>
      )}
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

const actions = {
  openEdit: (navigate, location) => {
    const data = store.state.data;
    const id = store.state.selectedIds[0];
    if (!id) return false;
    if (data.blocks[id].reference_id?.startsWith("pg_")) {
      navigate(`/${data.blocks[id].reference_id}`);
    } else {
      navigate(`/edit/${store.state.pageId}/${id}`, {
        state: {
          backgroundLocation: location,
        },
      });
      return true;
    }
  },
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
      if (actions.openEdit(navigate, location)) {
        ev.stopPropagation();
        ev.preventDefault();
      }
    } else if (ev.key == "ArrowUp") {
      const id = store.state.selectedIds[0];
      if (!id) return;
      const prevId = blocks.find((x) => x.block.next_sibling_id == id)?.block
        .id;
      if (prevId) {
        store.update({ selectedIds: [prevId] });
      }
      ev.stopPropagation();
      ev.preventDefault();
    } else if (ev.key == "ArrowDown") {
      const id = store.state.selectedIds[0];
      const nextId = id ? data.blocks[id].next_sibling_id : page.first_child_id;
      if (nextId) {
        store.update({ selectedIds: [nextId] });
      }
      ev.stopPropagation();
      ev.preventDefault();
    }
    // console.log(ev.key);
  });
  const doubleClickEvent = useEvent((ev) => {
    if (actions.openEdit(navigate, location)) {
      ev.stopPropagation();
    }
  });

  useEffect(() => {
    if (page)
      divRef.current?.focus({
        preventScroll: true,
      });
  }, [page]);

  const divRef = useRef();
  if (!page) return;

  return (
    <div
      onKeyDownCapture={keyEvent}
      tabIndex={0}
      style={{ padding: 10 }}
      autoFocus={true}
      onFocusCapture={(ev) =>
        divRef.current.focus({
          preventScroll: true,
        })
      }
      onClickCapture={(ev) =>
        divRef.current.focus({
          preventScroll: true,
        })
      }
      onDoubleClick={doubleClickEvent}
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

const BlockContainer = React.memo(({ block, indent, ...props }) => {
  return (
    <div style={{ marginLeft: indent * 50 }}>
      {block.reference_id && block.reference_id.startsWith("pg_") ? (
        <PageLink id={block.id} {...props} />
      ) : block.reference_id && block.reference_id.startsWith("bk_") ? (
        <Bookmark id={block.id} {...props} />
      ) : block.reference_id && block.reference_id.startsWith("gl_") ? (
        <Gallery id={block.id} {...props} />
      ) : (
        <Text id={block.id} {...props} />
      )}
    </div>
  );
});

const Block = ({ children, id, type, className }) => {
  const selected = store.useValue((x) => x.selectedIds.includes(id));
  const events = {
    onMouseDown: (ev) => {
      store.update((draft) => {
        if (ev.metaKey) {
          const index = draft.selectedIds.indexOf(id);
          index > -1
            ? draft.selectedIds.splice(index, 1)
            : draft.selectedIds.push(id);
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
      className={`block block-${type} ${selected ? "block-selected" : ""} ${
        className ?? ""
      }`}
      {...events}
    >
      {children}
    </div>
  );
};

const Bookmark = React.memo(({ id, small }) => {
  const block = store.useValue((x) => x.data.blocks[id]);
  const bookmark = store.useValue((x) => x.data.bookmarks[block.reference_id]);

  const type = small ? "small" : "regular";

  return (
    <Block id={id} type="bookmark" className={`block-bookmark--${type}`}>
      <div className={`block-bookmark-main block-bookmark-main--${type}`}>
        <div className={`block-bookmark-title block-bookmark-title--${type}`}>
          <strong>{bookmark.title}</strong>
        </div>
        <div
          className={`block-bookmark-description block-bookmark-description--${type}`}
        >
          {bookmark.description}
        </div>
        <div className={`block-bookmark-bottom block-bookmark-bottom--${type}`}>
          {bookmark.logo ? <img src={bookmark.logo} /> : null}
          <a href={bookmark.url}>{bookmark.url}</a>
        </div>
      </div>

      {bookmark.image ? (
        <div
          className={`block-bookmark-preview block-bookmark-preview--${type}`}
        >
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

const Gallery = React.memo(({ id }) => {
  const block = store.useValue((x) => x.data.blocks[id]);
  const gallery = store.useValue((x) => x.data.galleries[block.reference_id]);

  const blocks = store.useValue((x) => x.data.blocks);
  const groupedChildren = useMemo(() => {
    const children = Object.values(blocks).filter(
      (x) => x.parent_block_id == id
    );
    children.sort((a, b) => b.created_at - a.created_at);
    const grouped = groupByDate(children);

    return [
      grouped["day"] ? ["Today", grouped["day"]] : null,
      grouped["week"] ? ["This week", grouped["week"]] : null,
      grouped["month"] ? ["This month", grouped["month"]] : null,
      grouped["3month"] ? ["A few months ago", grouped["3month"]] : null,
      grouped["year"] ? ["This year", grouped["year"]] : null,
      grouped["other"] ? ["older than a year", grouped["other"]] : null,
    ].filter(Boolean);
  }, [blocks]);

  const [type, setType] = useState("grid");

  return (
    <Block id={id} type="gallery">
      <div>
        <button
          onMouseDown={(ev) => ev.stopPropagation()}
          onClick={(ev) => {
            setType("grid");
            ev.stopPropagation();
          }}
        >
          Grid
        </button>
        <button
          onMouseDown={(ev) => ev.stopPropagation()}
          onClick={(ev) => {
            setType("rows");
            ev.stopPropagation();
          }}
        >
          Rows
        </button>
      </div>
      <div className={`gallery-container--${type}`}>
        {groupedChildren.map(([label, children]) => {
          return (
            <>
              <div className="gallery-label">{label}</div>
              {children.map((block) => {
                return (
                  <div className={`gallery-cell--${type}`}>
                    <BlockContainer
                      block={block}
                      indent={0}
                      small={type == "grid"}
                    />
                  </div>
                );
              })}
            </>
          );
        })}
      </div>
    </Block>
  );
});

const groupByDate = (blocks) => {
  const now = Date.now();

  return groupBy(blocks, (block) => {
    const diff = now - block.created_at;
    if (diff < 1000 * 60 * 60 * 24) return "day";
    if (diff < 1000 * 60 * 60 * 24 * 7) return "week";
    if (diff < 1000 * 60 * 60 * 24 * 30) return "month";
    if (diff < 1000 * 60 * 60 * 24 * 30 * 3) return "3month";
    if (diff < 1000 * 60 * 60 * 24 * 365) return "year";
    return "other";
  });
};

const groupBy = (array, f) => {
  return array.reduce((result, currentValue) => {
    const key = f(currentValue);
    (result[key] = result[key] || []).push(currentValue);
    return result;
  }, {});
};
