import Bezier from "./Bezier";
import { createMemo, createEffect } from "solid-js";
import getColorFromHue from "../helpers/getColorFromHue";

import { useStore } from "../managers/Store";

function TemporaryConnection(props) {
  const [state, actions] = useStore();

  const PADDING = 10;
  const MARGIN = 10;
  const ROLE_HEIGHT = 15;

  const getPositionPort = createMemo(() => {
    // if (!props.role_offset) return { x: 0, y: 0 };
    return {
      x: parseInt(
        props.node_position.x +
          props.role_offset.width / 2 +
          props.role_offset.x +
          MARGIN
      ),
      y:
        props.direction === "in"
          ? parseInt(props.node_position.y + props.role_offset.y + MARGIN)
          : parseInt(
              props.node_position.y +
                props.role_offset.y +
                ROLE_HEIGHT +
                MARGIN
            ),
    };
  });

  const getPositionNextPort = createMemo(() => {
    // if (!props.role_offset) return { x: 0, y: 0 };
    if (!props.next_node_position) return false;
    return {
      x: parseInt(
        props.next_node_position.x +
          props.next_role_offset.width / 2 +
          props.next_role_offset.x +
          MARGIN
      ),
      y:
        props.direction === "out"
          ? parseInt(
              props.next_node_position.y + props.next_role_offset.y + MARGIN
            )
          : parseInt(
              props.next_node_position.y +
                props.next_role_offset.y +
                ROLE_HEIGHT +
                MARGIN
            ),
    };
  });

  const getPositionCursor = createMemo(() => {
    return {
      x:
        (state.editor.navigation.cursor.x - state.editor.navigation.origin.x) /
        state.editor.navigation.zoom,
      y:
        (state.editor.navigation.cursor.y - state.editor.navigation.origin.y) /
        state.editor.navigation.zoom,
    };
  }, [state.editor.navigation.cursor, state.editor.navigation.origin]);

  /*   createEffect(() => {
     
  }, [getPositionCursor(), getPositionPort()]); */

  const points = createMemo(() =>
    getPositionNextPort()
      ? [getPositionNextPort(), getPositionCursor(), getPositionPort()]
      : [getPositionCursor(), getPositionPort()]
  );

  return (
    <Bezier
      points={points()}
      style={{ stroke: getColorFromHue(props.role_hue) }}
    ></Bezier>
  );
}
export default TemporaryConnection;
