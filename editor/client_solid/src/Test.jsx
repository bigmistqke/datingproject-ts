import cursorEventHandler from "./helpers/cursorEventHandler";
import { createSignal, onMount, For } from 'solid-js';

export default function Test(props) {
    const translate = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        let last_position = { x: e.clientX, y: e.clientY };
        let offset;
        await cursorEventHandler((e) => {
            offset = {
                x: (last_position.x - e.clientX),
                y: (last_position.y - e.clientY)
            }
            props.setState("blocks", props.block_id, "position", {
                x: props.position.x - offset.x,
                y: props.position.y - offset.y
            })
            last_position = {
                x: e.clientX,
                y: e.clientY
            }
        })
    }

    return <div
        onMouseDown={translate}
        style={{
            position: "absolute",
            width: "150px",
            height: "250px;",
            background: "red",
            left: `${props.position.x}px`,
            top: `${props.position.y}px`
        }}
    >qegqegeqg</div>
}

