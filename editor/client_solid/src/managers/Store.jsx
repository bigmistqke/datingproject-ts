import { createStore } from "solid-js/store";
import { createContext, useContext } from "solid-js";
// import { array_move, array_remove } from "../helpers/Pure";
import uniqid from "uniqid";
import EditorActions from "./EditorActions";
import ScriptActions from "./ScriptActions";
// import check from "./helpers/check";

const StoreContext = createContext();

export function Provider(props) {
  const check = (bool) => !(!bool && bool !== 0);

  const [state, setState] = createStore({
    script: {
      blocks: {},
      roles: {},
      instructions: {},
      description: "",
      script_id: null,
    },
    editor: {
      navigation: {
        cursor: {},
        origin: { x: 0, y: 0 },
        zoom: 1,
        zoomedOut: false,
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
      errored_block_ids: [],
      selected_block_ids: [],
      role_offsets: {},
      block_dimensions: {},
      temporary_connections: [],
      uploaders: [],
    },
  });

  let actions = {};

  const addToActions = (new_actions) => {
    Object.entries(new_actions).forEach(([action_name, action]) => {
      if (Object.keys(actions).indexOf(action_name) !== -1) {
        console.error("multiple actions with the same name:", action_name);
        return;
      } else {
        console.log();
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

  console.log(actions);

  let store = [state, actions];

  return (
    <StoreContext.Provider value={store}>
      {props.children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
