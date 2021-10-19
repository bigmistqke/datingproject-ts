import { createMemo, createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import "./Connection.css";
import Bezier from "./Bezier";
import getColorFromHue from "../helpers/getColorFromHue";

const Connection = (props) => {
  const MARGIN = 10;
  const ROLE_HEIGHT = 12;

  let [positions, setPositions] = createStore({
    prev: {
      x: null,
      y: null,
    },
    next: {
      x: null,
      y: null,
    },
  });

  let [state, setState] = createStore({
    boundaries: { in: false, out: false },
    SVG: {
      in: { x: 0, y: 0 },
      center: { x: 0, y: 0 },
      out: { x: 0, y: 0 },
    },
  });

  createEffect(() => {
    if (!props.out_role_offset) return false;
    setPositions("prev", {
      x:
        props.out_block_position.x +
        props.out_role_offset.width / 2 +
        props.out_role_offset.x +
        MARGIN,
      y:
        props.out_block_position.y +
        props.out_role_offset.y +
        ROLE_HEIGHT +
        MARGIN,
    });
  }, [props.out_block_position, props.out_role_offset]);

  createEffect(() => {
    if (!props.in_role_offset) return false;

    setPositions("next", {
      x:
        props.in_block_position.x +
        props.out_role_offset.width / 2 +
        props.in_role_offset.x +
        MARGIN,
      y: props.in_block_position.y + props.in_role_offset.y + MARGIN,
    });
  }, [props.in_block_position, props.in_role_offset]);

  return (
    <Bezier
      points={Object.values(positions)}
      style={{ stroke: getColorFromHue(props.role_hue) }}
    ></Bezier>
    // <svg
    //   className="connectionLine"
    //   width={
    //     Math.abs(state.boundaries.out.x - state.boundaries.in.x) + PADDING * 2
    //   }
    //   height={
    //     Math.abs(state.boundaries.out.y - state.boundaries.in.y) + PADDING * 2
    //   }
    //   style={{
    //     left: `${state.boundaries.out.x - PADDING}px`,
    //     top: `${state.boundaries.out.y - PADDING}px`,
    //     position: "absolute",
    //     /* height: `${Math.abs(
    //         state.boundaries.out.y - state.boundaries.in.y
    //       )}px`,
    //       width: `${
    //         Math.abs(state.boundaries.out.x - state.boundaries.in.x) +
    //         PADDING * 2
    //       }px`, */
    //   }}
    // >
    //   <path
    //     style={{ stroke: getColorFromHue(props.role_hue) }}
    //     d={`M${state.SVG.out.x},${state.SVG.out.y} C${state.SVG.out.x},${state.SVG.in.y} ${state.SVG.center.x},${state.SVG.in.y} ${state.SVG.center.x},${state.SVG.center.y}`}
    //   ></path>
    // </svg>
  );
};

export default Connection;
