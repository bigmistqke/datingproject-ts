import "./App.module.css";
import "./general.css";

import _Mqtt from "./modules/_Mqtt.js";
import urls from "./urls";

import { createSignal, createEffect, onMount, For, Show } from "solid-js";
import { createStore } from "solid-js/store";
// import { useParams } from "solid-app-router";

import Room from "./Room";
import QR from "./QR";
import Settings from "./Settings";

import { AndroidFullScreen } from "@awesome-cordova-plugins/android-full-screen";

function App() {
  AndroidFullScreen.immersiveMode();
  const mqtt = new _Mqtt();

  const [store, setStore] = createStore({
    rooms: {},
    qr_data: null,
    settings_opened: true,
    script_id: null,
    mode: "simple",
  });

  const openQR = ({ game_url }) => setStore("qr_data", { game_url });
  const closeQR = () => setStore("qr_data", false);

  const deleteRoom = async (room_id) => {
    let response = await fetch(`${urls.fetch}/api/room/delete/${room_id}`);
    if (!response) return;
    setStore("rooms", room_id, undefined);
  };

  createEffect(async () => {
    if (!store.script_id) return;

    await mqtt.connect(urls.socket, true, true);

    let all_rooms = await fetch(
      `${urls.fetch}/api/room/metadata/${
        store.script_id
      }?${new Date().getTime()}`
    ).then((res) => res.json());

    if (!all_rooms) return;

    mqtt.subscribe(
      `/createRoom/${store.script_id}`,
      ({ room_id, players, script_id, instructions_map, room_name }) => {
        setStore("rooms", room_id, {
          players,
          script_id: store.script_id,
          room_name,
        });
      }
    );

    setStore("rooms", all_rooms);
  });

  return (
    <>
      <Show when={store.settings_opened}>
        <Settings
          mode={store.mode}
          script_id={store.script_id}
          setMode={(m) => setStore("mode", m)}
          setScriptId={(s) => setStore("script_id", s)}
          closeSettings={() => setStore("settings_opened", false)}
        />
      </Show>
      <Show when={!store.settings_opened}>
        <div className="App">
          <Show when={mqtt}>
            <For each={Object.entries(store.rooms)}>
              {([room_id, room]) => (
                <Show when={room}>
                  <Room
                    setRoom={function () {
                      setStore("rooms", room_id, ...arguments);
                    }}
                    deleteRoom={() => deleteRoom(room_id)}
                    mqtt={mqtt}
                    script_id={store.script_id}
                    rooms={store.rooms}
                    key={room_id}
                    room={room}
                    room_id={room_id}
                    openQR={openQR}
                    mode={store.mode ? store.mode : "simple"}
                  ></Room>
                </Show>
              )}
            </For>
          </Show>
          <Show when={store.qr_data}>
            <QR data={store.qr_data} closeQR={closeQR}></QR>
          </Show>
        </div>
      </Show>
    </>
  );
}

export default App;
