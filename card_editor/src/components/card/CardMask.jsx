import { createSignal, createEffect } from "solid-js";

import { styled } from "solid-styled-components";

const CardMask = (props) => {
  const Mask = styled("div")`
    width: 100%;
    height: 100%;
    position: absolute;
  `;

  return (
    <Mask
      className="masked"
      style={{
        "clip-path": `polygon(0%  0%, 100%  0%, 100% ${props.percentage}%, 0% ${props.percentage}%)`,
      }}
    >
      {props.children}
    </Mask>
  );
};

export default CardMask;
