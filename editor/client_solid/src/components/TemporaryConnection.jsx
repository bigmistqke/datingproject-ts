import Bezier from "./Bezier";
import { createMemo, createEffect } from "solid-js";
import getColorFromHue from "../helpers/getColorFromHue";

function TemporaryConnection(props) {
  const PADDING = 10;
  const MARGIN = 10;
  const ROLE_HEIGHT = 15;

  const getPositionPort = createMemo(() => {
    // if (!props.role_offset) return { x: 0, y: 0 };
    return {
      x: parseInt(
        props.block_position.x +
          props.role_offset.width / 2 +
          props.role_offset.x +
          MARGIN
      ),
      y:
        props.direction === "in"
          ? parseInt(props.block_position.y + props.role_offset.y + MARGIN)
          : parseInt(
              props.block_position.y +
                props.role_offset.y +
                ROLE_HEIGHT +
                MARGIN
            ),
    };
  });

  const getPositionNextPort = createMemo(() => {
    console.log(props.next_block_position, props.next_role_offset);
    // if (!props.role_offset) return { x: 0, y: 0 };
    if (!props.next_block_position) return false;
    return {
      x: parseInt(
        props.next_block_position.x +
          props.next_role_offset.width / 2 +
          props.next_role_offset.x +
          MARGIN
      ),
      y:
        props.direction === "out"
          ? parseInt(
              props.next_block_position.y + props.next_role_offset.y + MARGIN
            )
          : parseInt(
              props.next_block_position.y +
                props.next_role_offset.y +
                ROLE_HEIGHT +
                MARGIN
            ),
    };
  });

  const getPositionCursor = createMemo(() => {
    return {
      x: props.cursor.x - props.origin.x,
      y: props.cursor.y - props.origin.y,
    };
  }, [props.cursor, props.origin]);

  /*   createEffect(() => {
    console.log("every render: ", getPositionCursor(), getPositionPort());
  }, [getPositionCursor(), getPositionPort()]); */

  const points = createMemo(() =>
    getPositionNextPort()
      ? [getPositionNextPort(), getPositionCursor(), getPositionPort()]
      : [getPositionCursor(), getPositionPort()]
  );

  createEffect(() => console.log(points()));

  return (
    <Bezier
      points={points()}
      style={{ stroke: getColorFromHue(props.role_hue) }}
    ></Bezier>
  );
}
export default TemporaryConnection;
