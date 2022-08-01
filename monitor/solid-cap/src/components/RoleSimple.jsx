import copy from "copy-to-clipboard";
import { createMemo, onMount, Show } from "solid-js";
import styles from "./Role.module.css";

export default function Role(props) {
  const setPlayer = function () {
    props.setRoom("players", props.role_id, ...arguments);
  };

  onMount(() => {
    console.log("role", props);

    props.mqtt.subscribe(
      `/monitor/${props.room_id}/${props.role_id}/ping`,
      ({ ping }, topic) => {
        setPlayer("ping", ping);
      }
    );

    props.mqtt.subscribe(
      `/monitor/${props.room_id}/${props.role_id}/current_instruction`,
      (instruction, topic) => {
        console.log("current_instruction", instruction);
        // setPlayer("instruction", instruction);
        props.setRoom("players", props.role_id, "instruction", instruction);
      }
    );
    props.mqtt.subscribe(
      `/${props.room_id}/${props.role_id}/instruction_index`,
      ({ instruction_index }, topic) => {
        console.log("THIS HAPPENS!!!!", instruction_index);
        props.setRoom(
          "players",
          props.role_id,
          "instruction_index",
          instruction_index
        );
      }
    );
    props.mqtt.subscribe(
      `/monitor/${props.room_id}/${props.role_id}/status`,
      ({ status }, topic) => {
        console.log("status", props.role_id, status);
        setPlayer("status", status);
      }
    );
    /*     props.mqtt.subscribe(
      `/monitor/${props.room_id}/${props.role_id}/ping`,
      (ping, topic) => setPlayer( "status", ping)
    ); */
  });

  const forcedSwipe = (e) => {
    console.log("ok?");
    let confirm = window.confirm("are you sure u want to force a swipe?");
    if (!confirm) return;
    props.mqtt.send(
      `/${props.room_id}/${props.role.role_id}/forcedSwipe`,
      "true"
    );
  };

  const forcedRefresh = (e) => {
    console.log("ok?");
    let confirm = window.confirm("are you sure u want to force a refresh?");
    if (!confirm) return;
    props.mqtt.send(
      `/${props.room_id}/${props.role.role_id}/forcedRefresh`,
      "true"
    );
  };

  const prevs_and_roles = createMemo(() =>
    props.instructions_map &&
    props.role.instruction &&
    props.role.instruction.prev_instruction_ids
      ? props.role.instruction.prev_instruction_ids.map(
          (prev_instruction_id) => [
            prev_instruction_id,
            props.instructions_map[prev_instruction_id],
          ]
        )
      : []
  );

  return (
    <div
      style={{ position: "relative" }}
      classList={{
        [styles.role]: true,
        [styles.connected]: props.role.status === "connected",
        [styles.finished]: props.role.status === "finished",
        [styles.disconnected]: props.role.status === "disconnected",
        [styles.default]:
          props.role.status !== "connected" ||
          props.role.status !== "disconnected",
      }}
    >
      <div class={styles.panel}>
        <Show when={props.role}>
          <Show when={props.role.autoswipe}>
            <div
              style={{
                position: "absolute",
                right: "5px",
                top: "5px",
                background: "rgb(0,250,0)",
                "border-radius": "50%",
                width: "20px",
                height: "20px",
              }}
            ></div>
          </Show>
          <div class={styles.top}>
            <span class={styles.name}>{props.role.name}</span>
            <span
              classList={{
                [styles.status]: true,
                [styles.connected]: props.role.status === "connected",
                [styles.finished]: props.role.status === "finished",
                [styles.disconnected]: props.role.status === "disconnected",
                [styles.default]:
                  props.role.status !== "connected" ||
                  props.role.status !== "disconnected",
              }}
            />
          </div>
          <div class={styles.middle}>
            <span>
              {props.role.instruction_index} / {props.role.instructions_length}
            </span>
          </div>
          <div class={styles.flex}>
            <button onClick={forcedSwipe}>swipe</button>
          </div>
        </Show>
      </div>
      <div
        classList={{ [styles.panel]: true, [styles.progress]: true }}
        style={{
          height:
            (props.role.instruction_index / props.role.instructions_length) *
              100 +
            "%",
        }}
      ></div>
    </div>
  );
}
