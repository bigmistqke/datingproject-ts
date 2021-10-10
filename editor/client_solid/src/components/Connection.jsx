import { createMemo, createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";

const Connection = (props) => {
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
      out: { y: 0 },
    },
  });

  createEffect(() => {
    if (!props.prev_role_offset) return false;
    setPositions("prev", {
      x:
        props.prev_block_position.x +
        props.prev_role_offset.width / 2 +
        props.prev_role_offset.x,
      y: props.prev_block_position.y + props.prev_role_offset.y + 15,
    });
  }, [props.prev_block_position, props.prev_role_offset]);

  createEffect(() => {
    if (!props.next_role_offset) return false;

    setPositions("next", {
      x:
        props.next_block_position.x +
        props.prev_role_offset.width / 2 +
        props.next_role_offset.x,
      y: props.next_block_position.y + props.next_role_offset.y,
    });
  }, [props.next_block_position, props.next_role_offset]);

  let PADDING = 10;

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
    console.log("PREV_ROLE_OFFSET_HEGIHT:", props.prev_role_offset.height);
    if (!positions.prev.x || !positions.next.x) return;
    // console.log(positions.prev.x, positions.next.x);
    // console.log("getBoundaries", getBoundaries(positions.prev, positions.next));
    setState("boundaries", getBoundaries(positions.prev, positions.next));
    setState("SVG", getSVG(positions.prev, positions.next));

    /*     */
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
      <span>
        {props.prev_block_id} - {props.next_block_id} - {props.role_id}
      </span>
      <path
        d={`M${state.SVG.out.x},${state.SVG.out.y} C${state.SVG.out.x},${state.SVG.in.y} ${state.SVG.center.x},${state.SVG.in.y} ${state.SVG.center.x},${state.SVG.center.y}`}
      ></path>
    </svg>
  );
};

export default Connection;
