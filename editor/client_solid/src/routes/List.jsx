// import "./general.css";
import getData from "../helpers/getData";

import { createSignal, For } from "solid-js";
import { createStore } from "solid-js/store";

import Test from "../Test.jsx";

// import {NormalCard} from "./card/CardTemplates.js"

let current = {};

function List() {
  const [state, setState] = createStore({
    nodes: {
      test: {
        position: {
          x: 500,
          y: 250,
        },
        node_id: "test",
      },
    },
  });

  return (
    <div className="App">
      <header className="row">All Scripts</header>
      <For each={Object.entries(state.nodes)}>
        {([node_id, node]) => {
          return (
            <Test
              position={node.position}
              node_id={node_id}
              nodes={state.nodes}
              setState={setState}
              test={state.nodes.test.position.x}
            ></Test>
          );
        }}
      </For>
    </div>
  );
}
export default List;
