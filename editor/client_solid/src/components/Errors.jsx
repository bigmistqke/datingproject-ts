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
  createEffect(() => {
    console.log(props.block_ids);
  }, [props.block_ids]);

  const navigateToBlock = () => {
    let block_id = props.block_ids[getCounter() % props.block_ids.length];
    props.storeManager.editor.navigateToBlockId(block_id);
    setCounter(getCounter() + 1);
  };

  return (
    <div className="error">
      <span onMouseDown={navigateToBlock}>{props.text}</span>
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
                block_ids={error.block_ids}
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
