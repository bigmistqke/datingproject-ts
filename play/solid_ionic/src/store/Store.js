
import { createStore } from "solid-js/store";
import { createContext, useContext } from "solid-js";
import GeneralActions from './GeneralActions';
import PlayActions from './PlayActions';
import DesignActions from './DesignActions';
import SocketActions from './SocketActions';

let state, setState, ref, actions;
const StoreContext = createContext();


export function Provider(props) {

  [state, setState, ref] = createStore({
    previous_game_id: undefined,
    ids: {
      game: null,
      player: null,
      role: null,
      room: null
    },

    instructions: undefined,
    design: null,
    bools: {
      isInitialized: false,
    },
    viewport: {
      timer: null,
      card_size: {
        height: null,
        width: null
      },
    }
  });

  let actions = {
    setInstructions: (instructions) => setState("instructions", instructions),
    setIds: (ids) => setState("ids", ids),
    setDesign: (design) => setState("design", design)
  };

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

  actions = { ...actions, ...new SocketActions({ state, setState, actions, ref }) };
  actions = { ...actions, ...new DesignActions({ state, setState, actions, ref }) };
  actions = { ...actions, ...new PlayActions({ state, setState, actions, ref }) };
  actions = { ...actions, ...new GeneralActions({ state, setState, actions, ref }) };

  let store = [state, actions, ref];


  return <StoreContext.Provider value={store}>
    {props.children}
  </StoreContext.Provider>
}

export function useStore() {
  return useContext(StoreContext);
}