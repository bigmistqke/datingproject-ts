import "./Errors.css";

import {
  onMount,
  mapArray,
  createMemo,
  createEffect,
  createSignal,
} from "solid-js";

import { createStore } from "solid-js/store";
import { useStore } from "../managers/Store";

function Error(props) {
  const [state, actions] = useStore();

  const [getCounter, setCounter] = createSignal(0);

  const navigateToNode = () => {
    let node_id = props.node_ids[getCounter() % props.node_ids.length];
    actions.navigateToNodeId(node_id);
    setCounter(getCounter() + 1);
  };

  return (
    <div className="error">
      <span onMouseDown={navigateToNode}>{props.text}</span>
    </div>
  );
}
/* createEffect(()=>{
})
 */
let last_errors = [];
function Errors(props) {
  return (
    <div className="errors-container">
      {
        <For each={props.errors}>
          {(error) => {
            return (
              <Error
                text={error.text}
                node_ids={error.node_ids}
                storeManager={props.storeManager}
              ></Error>
            );
          }}
        </For>
      }
    </div>
  );
}

export default Errors;
