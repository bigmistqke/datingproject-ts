import { createMemo } from "solid-js";
import "./Block.css";
import "./DragBox.css";

import cursorEventHandler from "../helpers/cursorEventHandler";
export default function DragBox(props) {
  let getClassList = createMemo(
    () => (props.classList ? props.classList : {}),
    [props.classList]
  );

  const initTranslation = async function (e) {
    if (e.button !== 0 || !e.target.classList.contains("block-drag")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    if (props.onPointerDown) props.onPointerDown();

    let lastTick = performance.now();

    let last_position = { x: e.clientX, y: e.clientY };
    let offset;

    await cursorEventHandler((e) => {
      if (performance.now() - lastTick < 1000 / 60) return;
      lastTick = performance.now();
      offset = {
        x: (last_position.x - e.clientX) * -1,
        y: (last_position.y - e.clientY) * -1,
      };

      if (props.onTranslate) props.onTranslate(offset);

      last_position = {
        x: e.clientX,
        y: e.clientY,
      };
    });
    if (props.onPointerUp) props.onPointerUp();
  };

  return (
    <div
      id={props.id}
      classList={{
        block: true,
        ...getClassList(),
      }}
      onPointerDown={initTranslation}
      onContextMenu={props.onContextMenu}
      style={{
        ...props.style,
        // transform: `translate(${props.position.x}px, ${props.position.y}px)`,
        left: props.position.x + "px",
        top: props.position.y + "px",
      }}
    >
      <div className="block-drag"></div>
      <div className="block-children">{props.children}</div>
    </div>
  );
}
