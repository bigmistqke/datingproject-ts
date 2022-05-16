import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { useStore } from "../managers/Store";
// components
import Bezier from "./Bezier";
// helpers
import getColorFromHue from "../helpers/getColorFromHue";

const Connection = (props) => {
  const [state, actions] = useStore();

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

  createEffect(() => {
    if (!props.in_role_offset || !props.out_role_offset) return false;
    setPositions("prev", {
      x:
        props.out_node_position.x +
        props.out_role_offset.width / 2 +
        props.out_role_offset.x +
        MARGIN,
      y:
        props.out_node_position.y +
        props.out_role_offset.y +
        ROLE_HEIGHT +
        MARGIN,
    });
  }, [props.out_node_position, props.out_role_offset]);

  createEffect(() => {
    if (!props.in_role_offset || !props.out_role_offset) return false;

    setPositions("next", {
      x:
        props.in_node_position.x +
        props.out_role_offset.width / 2 +
        props.in_role_offset.x +
        MARGIN,
      y: props.in_node_position.y + props.in_role_offset.y + MARGIN,
    });
  }, [props.in_node_position, props.in_role_offset]);

  return (
    <Bezier
      points={Object.values(positions)}
      style={{ stroke: getColorFromHue(props.role_hue) }}
    ></Bezier>
  );
};

export default Connection;
