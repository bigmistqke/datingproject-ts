import copy from "copy-to-clipboard";
import { createMemo, onMount, Show } from "solid-js";
import "./Role.css";
import urls from "./urls";

export default function Role(props) {
  // let role_url;

  // const openLink = () => window.open(role_url);

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

  const copyLink = (e) => {
    copy(role_url);
    e.target.innerHTML = "copied!";
    setTimeout(() => {
      e.target.innerHTML = "copy";
    }, 1000);
  };

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

  const autoswipe = (e) => {
    console.log("ok?");

    let confirm = window.confirm("are you sure u want to autoswipe?");
    if (!confirm) return;
    props.mqtt.send(
      `/${props.room_id}/${props.role.role_id}/autoswipe`,
      JSON.stringify({ autoswipe: !props.role.autoswipe })
    );
    setPlayer("autoswipe", !props.role.autoswipe);
  };

  const prevs_and_roles = createMemo(() =>
    props.role.instruction && props.role.instruction.prev_instruction_ids
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
      classList={{
        role: true,
        connected: props.role.status === "connected",
        finished: props.role.status === "finished",
        disconnected: props.role.status === "disconnected",
      }}
    >
      <Show when={props.role}>
        <div class="marginBottom">
          <div class="row">
            <label>role</label>
            <span>{props.role.name}</span>
          </div>
          <div class="row">
            <label>status</label>
            <span
              style={{
                color:
                  props.role.status === "connected"
                    ? "green"
                    : props.role.status === "finished"
                    ? "blue"
                    : "red",
              }}
            >
              {props.role.status ? props.role.status : "never connected"}
            </span>
          </div>
          <div class="row">
            <label>ping</label>
            <span
              style={{
                color: props.role.ping === "error" ? "red" : "black",
              }}
            >
              <Show when={props.role.status === "connected" && props.role.ping}>
                {props.role.ping}ms
              </Show>
            </span>
          </div>
        </div>

        <div class="marginBottom instruction">
          <div class="row">
            <label>card</label>
          </div>
          <div class="row">
            <label class="margin">index</label>
            <span class="italic">
              {props.role.instruction_index} / {props.role.instructions_length}
            </span>
          </div>

          <Show
            when={
              props.role.instruction &&
              props.role.instruction.prev_instruction_ids
            }
          >
            <div class="row">
              <label class="margin">type</label>
              <span class="italic">{props.role.instruction.type}</span>
            </div>
            <div class="row">
              <label class="margin">prevs</label>
              <div class="italic prev_and_roles">
                <For each={prevs_and_roles().slice(0, 5)}>
                  {([prev_instruction_id, role_id]) => (
                    <div class="prev_and_role">
                      <label>{prev_instruction_id}</label>
                      <span>{role_id}</span>
                    </div>
                  )}
                </For>
                <Show when={prevs_and_roles().length > 5}>
                  <div>
                    ... ({prevs_and_roles().length - 5} more of{" "}
                    {prevs_and_roles().length})
                  </div>
                </Show>
              </div>
            </div>
            <div class="row">
              <label class="margin">text</label>
              <span
                className="instruction_text"
                classList={{
                  wait:
                    props.role.instruction.prev_instruction_ids.length !== 0,
                }}
              >
                <Show
                  when={
                    props.role.instruction.type !== "video" &&
                    props.role.instruction.text
                  }
                >
                  {props.role.instruction.text.map((v) => v.content).join()}
                </Show>
                <Show when={props.role.instruction.type === "video"}>
                  video
                </Show>
              </span>
            </div>
          </Show>
        </div>

        <div class="flex role_buttons marginBottom">
          <button
            onClick={() => {
              props.openQR({ game_url: props.room_id + props.role_id });
            }}
          >
            qr
          </button>
          <button onClick={forcedRefresh}>refresh</button>
        </div>
        <div class="flex">
          <button onClick={forcedSwipe}>swipe</button>
          <button onClick={autoswipe}>
            {props.role.autoswipe ? "stop" : "start"} autoswipe
          </button>
        </div>
      </Show>
    </div>
  );
}
