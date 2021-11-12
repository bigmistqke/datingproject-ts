import { createSignal, createEffect } from "solid-js";
import { styled } from "solid-styled-components";
// import "./Block.css";
// import "./DragBox.css";

import cursorEventHandler from "../../helpers/cursorEventHandler";

export default function Draggable(props) {
  let div_ref;

  const initTranslation = async function (e) {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    if (props.onPointerDown) props.onPointerDown(e);
    if (props.locked) return;

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
    if (props.onPointerUp) props.onPointerUp(e);
  };

  const DIV = styled("div")`
    width: 100%;
    height: 100%;
    &.locked,
    &.locked * {
      pointer-events: none !important;
    }
    /* background: red; */
    /* & > * {
      pointer-events: none;
    } */
  `;

  return (
    <DIV
      id={props.id}
      className={`draggable ${props.locked ? "locked" : ""}`}
      onMouseEnter={props.onMouseEnter}
      onMouseOut={props.onMouseOut}
      onPointerDown={initTranslation}
      onContextMenu={props.onContextMenu}
      ref={div_ref}
      style={{
        position: "absolute",
        left: props.position ? props.position.x + "%" : null,
        top: props.position ? props.position.y + "%" : null,
        "pointer-events": props.children ? "none" : "",
        ...props.style,
      }}
    >
      {props.children}
    </DIV>
  );
}
