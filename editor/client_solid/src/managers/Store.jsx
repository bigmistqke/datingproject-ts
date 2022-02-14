import { createStore } from "solid-js/store";
import { createContext, useContext } from "solid-js";
// import { array_move, array_remove } from "../helpers/Pure";
import uniqid from "uniqid";
import EditorActions from "./EditorActions";
import ScriptActions from "./ScriptActions";
// import check from "./helpers/check";

const StoreContext = createContext();

const Q = function () {
  let queue = [];
  const process = () => {
    queue[0].resolve(queue[0].action());
    queue.shift();
    if (queue.length === 0) return;
    setTimeout(() => {
      process();
    }, 5);
  };
  this.add = (action) =>
    new Promise((resolve) => {
      queue.push({ action, resolve });
      if (queue.length === 1) {
        setTimeout(() => {
          process();
        }, 5);
      }
    });
};

export function Provider(props) {
  const check = (bool) => !(!bool && bool !== 0);

  const [state, setState] = createStore({
    script: {
      groups: {},
      nodes: {},
      roles: {},
      instructions: {},
      description: "",
      script_id: null,
      design_id: null,
    },
    editor: {
      navigation: {
        cursor: { x: 0, y: 0 },
        origin: { x: 0, y: 0 },
        origin_grid: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        zoom: 1,
        zoomedOut: false,
        grid_size: 2000,
      },
      gui: {
        prompt: false,
        selectionBox: false,
        role_admin: false,
        tooltip: false,
        sub_menu: false,
      },
      bools: {
        isConnecting: false,
        isInitialized: false,
        isShiftPressed: false,
        isCtrlPressed: false,
        isMenuOpen: false,
        isTranslating: false,
      },
      errors: {},
      errored_node_ids: [],
      selection: [],
      role_offsets: {},
      node_dimensions: {},
      temporary_connections: [],
      uploaders: {},
      visited_parent_ids: [],
      parent_ids: [],
    },
  });

  let actions = {};

  const addToActions = (new_actions) => {
    Object.entries(new_actions).forEach(([action_name, action]) => {
      if (Object.keys(actions).indexOf(action_name) !== -1) {
        console.error("multiple actions with the same name:", action_name);
        return;
      } else {
        actions = { ...actions, [action_name]: action };
      }
    });
  };

  addToActions(new EditorActions({ state, setState, actions }));
  addToActions(new ScriptActions({ state, setState, actions }));

  // new EditorActions({ state, setState, actions }).addTemporaryConnection();
  // new EditorActions({ state, setState, actions })
  // actions = { ...actions, ...new EditorActions({ state, setState, actions }) };
  // actions = { ...actions, ...new ScriptActions({ state, setState, actions }) };

  let q = new Q();

  let store = [state, actions, q];

  return (
    <StoreContext.Provider value={store}>
      {props.children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
