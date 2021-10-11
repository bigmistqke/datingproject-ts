import { createMemo, createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import "./Connection.css";

const Connection = (props) => {
  const PADDING = 10;
  const MARGIN = 15;
  const ROLE_HEIGHT = 15;

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
    console.log("I KEEP  TRACK OF", props.next_block_id);
  }, [props.next_block_id]);

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

  const getBoundaries = (start, end) => {
    let bounds = {
      out: {
        x: null,
        y: null,
      },
      in: {
        x: null,
        y: null,
      },
    };

    bounds.out.x = start.x < end.x ? start.x : end.x;
    bounds.out.y = start.y < end.y ? start.y : end.y;
    bounds.in.x = start.x > end.x ? start.x : end.x;
    bounds.in.y = start.y > end.y ? start.y : end.y;
    return bounds;
  };

  const getSVG = (start, end) => {
    let coords = {
      in: { x: 0, y: 0 },
      center: { x: 0, y: 0 },
      out: { x: 0, y: 0 },
    };
    coords.out.x = start.x < end.x ? PADDING : start.x - end.x + PADDING;
    coords.out.y = start.y < end.y ? PADDING - 1 : start.y - end.y + PADDING;
    coords.center.x = start.x > end.x ? PADDING : end.x - start.x + PADDING;
    coords.center.y = start.y > end.y ? PADDING - 1 : end.y - start.y + PADDING;
    coords.in.y = Math.abs(start.y - end.y) / 2;
    return coords;
  };

  createEffect(() => {
    if (!positions.prev.x || !positions.next.x) return;
    setState("boundaries", getBoundaries(positions.prev, positions.next));
    setState("SVG", getSVG(positions.prev, positions.next));
  }, [positions.prev, positions.next]);
  return (
    <svg
      className="connectionLine"
      width={
        Math.abs(state.boundaries.out.x - state.boundaries.in.x) + PADDING * 2
      }
      height={
        Math.abs(state.boundaries.out.y - state.boundaries.in.y) + PADDING * 2
      }
      style={{
        left: `${state.boundaries.out.x - PADDING}px`,
        top: `${state.boundaries.out.y - PADDING}px`,
        position: "absolute",
        /* height: `${Math.abs(
            state.boundaries.out.y - state.boundaries.in.y
          )}px`,
          width: `${
            Math.abs(state.boundaries.out.x - state.boundaries.in.x) +
            PADDING * 2
          }px`, */
      }}
    >
      <path
        style={{ stroke: `hsl(${props.role_hue}, 100%, 50%)` }}
        d={`M${state.SVG.out.x},${state.SVG.out.y} C${state.SVG.out.x},${state.SVG.in.y} ${state.SVG.center.x},${state.SVG.in.y} ${state.SVG.center.x},${state.SVG.center.y}`}
      ></path>
    </svg>
  );
};

export default Connection;
