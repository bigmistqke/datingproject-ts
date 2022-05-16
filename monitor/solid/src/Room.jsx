import { createMemo, For, onMount } from "solid-js";
import postData from "../../../editor/client_solid/src/helpers/postData";

import Role from "./Role";
import RoleSimple from "./RoleSimple";

// import "./Room.css";
import styles from "./Room.module.css";
import urls from "./urls.js";

export default function Room(props) {
  const restartRoom = async () => {
    if (!window.confirm("are you sure you want to restart the game?")) return;
    let response = await fetch(
      `${urls.fetch}/api/room/restart/${props.room_id}`
    );
    console.log(response);
    if (!response) return;
  };

  let sorted_players = createMemo(() => {
    if (!props.room.players) return [];
    return Object.entries(props.room.players).sort(
      (a, b) => a[1].name - b[1].name
    );
  });

  const changeName = async (e) => {
    let room_name = e.target.value;
    let response = await postData(
      `${urls.fetch}/api/room/rename/${props.room_id}`,
      { room_name, script_id: props.script_id }
    );
    if (response.status !== 200) {
      console.error("changing name did not succeed: ", response.body);
    }
  };

  return (
    <div
      classList={{
        [styles.room]: true,
        [styles.advanced]: props.mode === "advanced",
      }}
    >
      <div class={styles.top}>
        <div>
          <h1>
            <Show when={props.mode === "advanced"}>
              <input
                class={styles.input}
                onChange={changeName}
                value={props.room.room_name}
              />
            </Show>
            <Show when={props.mode === "simple"}>
              <div class={styles.input}>{props.room.room_name}</div>
            </Show>
          </h1>
        </div>
        <Show when={props.mode === "advanced"}>
          <button onClick={props.deleteRoom}>delete</button>
        </Show>
        <button onClick={restartRoom}>restart</button>
      </div>

      <div class={styles.roles}>
        <Show when={props.room && props.room.players}>
          <For each={sorted_players()}>
            {([role_id, role]) =>
              props.mode === "simple" ? (
                <RoleSimple
                  mqtt={props.mqtt}
                  room_id={props.room_id}
                  role_id={role_id}
                  role={role}
                  openQR={props.openQR}
                  setRoom={props.setRoom}
                  instructions_map={props.room.instructions_map}
                />
              ) : (
                <Role
                  mqtt={props.mqtt}
                  room_id={props.room_id}
                  role_id={role_id}
                  role={role}
                  openQR={props.openQR}
                  setRoom={props.setRoom}
                  instructions_map={props.room.instructions_map}
                />
              )
            }
          </For>
        </Show>
      </div>
    </div>
  );
}
