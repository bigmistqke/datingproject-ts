import { createMemo, For, onMount } from "solid-js";

import Role from "./Role";
import "./Room.css";
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

  /*   const updateRoom = async (e) => {
    try {
      let shouldUpdate = window.confirm(
        "are you sure you want to update the game?"
      );
      if (!shouldUpdate) return;
      let response = await fetch(
        `${urls.fetch}/api/room/update/${props.room_id}/${props.script_id}`
      );
      response = await response.json();
      console.log(response);
      if (!response.success) {
        console.error(response.errors);
      } else {
        e.target.innerHTML = "script updated!";
        setTimeout(() => {
          e.target.innerHTML = "update script";
        }, 1000);
      }
    } catch (e) {
      console.error(e);
    }
  }; 
  const openCombo = () => {
    window.open(`${urls.editor}/test/${props.room_id}`);
  };*/

  /*  var monitor = () => {
    // if (!props.room.players) return;
    Object.entries(props.room.players).forEach(([player_id, role]) => {
      console.log("ROLE IS ", role);
      if (!role) return;
      props.mqtt.subscribe(
        `/monitor/${props.room_id}/${role.role_id}/current_instruction`,
        (instruction, topic) =>
          props.setRoom("players", player_id, "instruction", instruction)
      );
      props.mqtt.subscribe(
        `/monitor/${props.room_id}/${role.role_id}/status`,
        (status, topic) => props.setRoom("players", player_id, "status", status)
      );
      props.mqtt.subscribe(
        `/monitor/${props.room_id}/${role.role_id}/ping`,
        (ping, topic) => props.setRoom("players", player_id, "status", ping)
      );
    });

    props.mqtt.subscribe(`/${props.room_id}/#`, (message, topic) => {
      message = JSON.parse(message);
    });
  };

  onMount(monitor); */

  let sorted_players = createMemo(() =>
    Object.entries(props.room.players).sort((a, b) => a[1].name - b[1].name)
  );

  return (
    <div className="room">
      <div className="top">
        <div>
          <h1>id: {props.room_id} </h1>
        </div>
        <button onClick={props.deleteRoom}>delete</button>
        <button onClick={restartRoom}>restart</button>
        {/* <button onClick={updateRoom}>update script</button> */}
        {/* <button onClick={openCombo}>combo</button> */}
      </div>

      <div className="roles">
        <Show when={props.room && props.room.players}>
          <For each={sorted_players()}>
            {([role_id, role]) => (
              <Role
                mqtt={props.mqtt}
                room_id={props.room_id}
                role_id={role_id}
                role={role}
                openQR={props.openQR}
                setRoom={props.setRoom}
                instructions_map={props.room.instructions_map}
              ></Role>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}
