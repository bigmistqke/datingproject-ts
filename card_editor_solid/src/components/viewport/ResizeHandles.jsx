import cursorEventHandler from "../../helpers/cursorEventHandler";
import Draggable from "./Draggable";
import { createMemo } from "solid-js";
import { styled } from "solid-styled-components";

const ResizeHandles = (props) => {
  const top = {
    top: "0px",
  };
  const bottom = {
    bottom: "0px",
  };
  const left = {
    left: "0px",
  };
  const right = {
    right: "0px",
  };

  const corner = {
    width: "15px",
    height: "15px",
  };
  const vertical = {
    width: "calc(100% - 30px)",
    "margin-left": "15px",
    height: "5px",
  };
  const horizontal = {
    height: "calc(100% - 30px)",
    "margin-top": "15px",
    width: "5px",
  };

  const ResizeHandleContainer = styled("div")`
    position: absolute;
    /* z-index: 1; */
    pointer-events: none;
    width: 100%;
    height: 100%;
    & > * {
      pointer-events: all;
      background: rgba(200, 200, 200, 0.25);
    }
  `;

  const resize = ({ top, bottom, left, right }) => {
    let position = { ...props.position };
    let dimensions = { ...props.dimensions };

    if (top) {
      top = (top / props.card_size.height) * 100;
      position.y = props.position.y + top;
      dimensions.height = props.dimensions.height - top;
    }
    if (bottom) {
      bottom = (bottom / props.card_size.height) * 100;
      dimensions.height = props.dimensions.height + bottom;
    }
    if (left) {
      left = (left / props.card_size.width) * 100;
      position.x = props.position.x + left;
      dimensions.width = props.dimensions.width - left;
    }
    if (right) {
      right = (right / props.card_size.width) * 100;

      dimensions.width = props.dimensions.width + right;
    }

    props.onResize({ position, dimensions });
  };

  return (
    <ResizeHandleContainer>
      <Draggable
        style={{ ...vertical, ...top, cursor: "ns-resize" }}
        onTranslate={(delta) => resize({ top: delta.y })}
        locked={props.locked}
      ></Draggable>
      <Draggable
        style={{ ...vertical, ...bottom, cursor: "ns-resize" }}
        onTranslate={(delta) => resize({ bottom: delta.y })}
        locked={props.locked}
      ></Draggable>

      <Draggable
        style={{ ...horizontal, ...left, cursor: "w-resize" }}
        onTranslate={(delta) => resize({ left: delta.x })}
        locked={props.locked}
      ></Draggable>
      <Draggable
        style={{ ...horizontal, ...right, cursor: "w-resize" }}
        onTranslate={(delta) => resize({ right: delta.x })}
        locked={props.locked}
      ></Draggable>

      <Draggable
        style={{ ...corner, ...top, ...left, cursor: "nw-resize" }}
        onTranslate={(delta) => resize({ top: delta.y, left: delta.x })}
        locked={props.locked}
      ></Draggable>
      <Draggable
        style={{ ...corner, ...top, ...right, cursor: "ne-resize" }}
        onTranslate={(delta) => resize({ top: delta.y, right: delta.x })}
        locked={props.locked}
      ></Draggable>
      <Draggable
        style={{ ...corner, ...bottom, ...left, cursor: "sw-resize" }}
        onTranslate={(delta) => resize({ bottom: delta.y, left: delta.x })}
        locked={props.locked}
      ></Draggable>
      <Draggable
        style={{ ...corner, ...bottom, ...right, cursor: "se-resize" }}
        onTranslate={(delta) => resize({ bottom: delta.y, right: delta.x })}
        locked={props.locked}
      ></Draggable>
    </ResizeHandleContainer>
  );
};

export default ResizeHandles;
