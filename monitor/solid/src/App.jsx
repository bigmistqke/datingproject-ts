import "./App.css";
import _Mqtt from "./modules/_Mqtt.js";
import urls from "./urls";

import { createSignal, createEffect, onMount, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { useParams } from "solid-app-router";

import Room from "./Room";
import QR from "./QR";

function App() {
  let { script_id, mode } = useParams();

  const [rooms, setRooms] = new createStore({});

  const [QRData, setQRData] = createSignal(false);
  let mqtt = new _Mqtt();

  const openQR = ({ game_url }) => {
    console.log("open ", game_url);
    setQRData({ game_url });
  };
  const closeQR = () => setQRData(false);

  onMount(async () => {
    await mqtt.connect(urls.socket, true, true);

    let all_rooms = await fetch(
      `${urls.fetch}/api/room/metadata/${script_id}?${new Date().getTime()}`
    );

    if (all_rooms.status !== 200) return;

    all_rooms = await all_rooms.json();

    mqtt.subscribe(
      `/createRoom/${script_id}`,
      ({ room_id, players, script_id, instructions_map, room_name }) => {
        console.log(`/createRoom/${script_id}`, {
          room_id,
          players,
          script_id,
          instructions_map,
        });
        setRooms(room_id, { players, script_id, room_name });
      }
    );

    setRooms(all_rooms);
  });

  const deleteRoom = async (room_id) => {
    let response = await fetch(`${urls.fetch}/api/room/delete/${room_id}`);
    if (!response) return;
    setRooms(room_id, undefined);
  };

  return (
    <div className="App">
      <Show when={mqtt}>
        <For each={Object.entries(rooms)}>
          {([room_id, room]) => (
            <Show when={room}>
              <Room
                setRoom={function () {
                  setRooms(room_id, ...arguments);
                }}
                deleteRoom={() => deleteRoom(room_id)}
                mqtt={mqtt}
                script_id={script_id}
                rooms={rooms}
                key={room_id}
                room={room}
                room_id={room_id}
                openQR={openQR}
                mode={mode ? mode : "simple"}
              ></Room>
            </Show>
          )}
        </For>
      </Show>
      <Show when={QRData()}>
        <QR data={QRData()} closeQR={closeQR}></QR>
      </Show>
    </div>
  );
}

export default App;
