import Bezier from "./Bezier";
import { createMemo, createEffect } from "solid-js";
import getColorFromHue from "../helpers/getColorFromHue";

function TemporaryConnection(props) {
  const PADDING = 10;
  const MARGIN = 15;
  const ROLE_HEIGHT = 15;

  const getPositionPort = createMemo(() => {
    // if (!props.role_offset) return { x: 0, y: 0 };
    return {
      x:
        props.block_position.x +
        props.role_offset.width / 2 +
        props.role_offset.x +
        MARGIN,
      y:
        props.direction === "in"
          ? props.block_position.y + props.role_offset.y + MARGIN
          : props.block_position.y + props.role_offset.y + ROLE_HEIGHT + MARGIN,
    };
  }, [props.out_block_position, props.out_role_offset, props.direction]);

  const getPositionCursor = createMemo(() => {
    return {
      x: props.cursor.x - props.origin.x,
      y: props.cursor.y - props.origin.y,
    };
  }, [props.cursor, props.origin]);

  /*   createEffect(() => {
    console.log("every render: ", getPositionCursor(), getPositionPort());
  }, [getPositionCursor(), getPositionPort()]); */

  return (
    <Bezier
      points={[getPositionCursor(), getPositionPort()]}
      style={{ stroke: getColorFromHue(props.role_hue) }}
    ></Bezier>
  );
}
export default TemporaryConnection;
