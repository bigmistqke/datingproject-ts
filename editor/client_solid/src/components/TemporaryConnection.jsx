import Connection from "./Connection";

import { createEffect, onMount } from "solid-js";

function TemporaryConnection(props) {
  return (
    <>
      {props.direction === "in" ? (
        <Connection
          role_hue={props.role_hue}
          out_block_position={props.block_position}
          out_role_offset={props.role_offset}
          in_block_position={{
            x:
              props.cursor.x -
              props.origin.x -
              props.role_offset.width / 2 -
              15,
            y: props.cursor.y - props.origin.y - props.role_offset.height / 2,
          }}
          in_role_offset={{ x: 0, y: 0, width: 0 }}
        ></Connection>
      ) : (
        <Connection
          role_hue={props.role_hue}
          out_block_position={{
            x:
              props.cursor.x -
              props.origin.x -
              props.role_offset.width / 2 +
              15,
            y: props.cursor.y - props.origin.y - props.role_offset.height / 2,
          }}
          out_role_offset={{
            x: 0,
            y: props.role_offset.height * -1,
            width: 0,
          }}
          in_block_position={props.block_position}
          in_role_offset={{
            ...props.role_offset,
            x: props.role_offset.x + props.role_offset.width / 2,
            y: props.role_offset.y + props.role_offset.height,
          }}
        ></Connection>
      )}
    </>
  );
}
export default TemporaryConnection;
