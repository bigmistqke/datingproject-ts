import { styled } from "solid-styled-components";

import Draggable from "./Draggable";
import { createSignal, createEffect } from "solid-js";

const MaskHandle = (props) => {
  const [setFocus, getFocus] = createSignal("true");

  const onTranslate = (delta) => {
    let percentage_delta = (delta.y / (window.innerHeight * 0.9)) * 100;
    props.onTranslate(props.percentage + percentage_delta);
  };

  const Line = styled("div")`
    height: 3px;
    width: 100%;
    top: 50%;
    transform: translateY(-50%);
    background: lightgrey;
    position: absolute;
    z-index: 5;
    pointer-events: none;
  `;

  return (
    <Draggable
      style={{
        width: "100%",
        height: "20px",
        cursor: "ns-resize",
        transform: "translateY(-50%)",
        "pointer-events": "all !important",
        top: `${
          (props.percentage / 100) * 0.9 * window.innerHeight +
          0.05 * window.innerHeight
        }px`,
      }}
      onTranslate={onTranslate}
      checkForTransparency={false}
    >
      <Line></Line>
    </Draggable>
  );
};

export default MaskHandle;
