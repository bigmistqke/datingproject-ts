// import "./general.css";
import getData from "../helpers/getData";

import { createSignal, For } from 'solid-js';
import { createStore } from 'solid-js/store'

import Test from "../Test.jsx";


// import {NormalCard} from "./card/CardTemplates.js"

let current = {};

function List() {
    const [state, setState] = createStore({
        blocks: {
            test: {
                position: {
                    x: 500,
                    y: 250
                },
                block_id: 'test'
            }
        }
    });

    return (
        <div className="App">
            <header className="row">
                All Scripts
            </header>
            <For each={Object.values(state.blocks)}>{(block) => {
                console.log(block.position, block.block_id);
                return <Test
                    position={block.position}
                    block_id={block.block_id}
                    blocks={state.blocks}
                    setState={setState}
                    test={state.blocks.test.position.x}
                ></Test>
            }
            }</For>
        </div>
    );
}
export default List;