import { createStore, produce } from "solid-js/store";
import { createContext, useContext } from "solid-js";
import { array_move, array_remove } from "../helpers/Pure";
import uniqid from "uniqid";
import Actions from "./Actions";
// import check from "./helpers/check";
const default_types = ["do", "say", "back"];

const StoreContext = createContext();

export function Provider(props) {
  const [state, setState] = createStore({
    design_id: null,
    pressed_keys: [],
    instruction: {},
    bools: {
      shouldSnap: false,
      isShiftPressed: false,
      isAltPressed: false,
      areGuidesLocked: false,
      areGuidesHidden: false,
    },
    guides: [],
    design: {
      background: "#efefef",
      border_radius: "5",
      card_dimensions: {
        width: 55.88507940957915,
        height: 100,
      },
      globals: {},
      elements: {},
      types: {},
    },
    viewport: {
      timer_percentage: 90,
      masked_styling: false,
      selected_element_index: false,
      type_manager: false,
      modes: {
        timed: false,
        choice: false,
      },
      type: default_types[0],
      prompt: false,
      card_size: {
        width: null,
        height: null,
      },
    },
  });

  const actions = new Actions({ state, setState, default_types });
  const store = [state, actions];

  return (
    <StoreContext.Provider value={store}>
      {props.children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
