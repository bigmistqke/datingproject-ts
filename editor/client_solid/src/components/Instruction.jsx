// import React, { useState, useEffect, useRef, memo, useCallback } from 'react';

import NumericInput from "./NumericInput";
// import
// import Select from 'react-select';
import "./Instruction.css";
import { Show, onMount, createMemo } from "solid-js";
import Select from "./Select";
import getColorFromHue from "../helpers/getColorFromHue";

import { useStore } from "../managers/Store";
import urls from "../urls";

const Instruction = (props) => {
  const [state, actions] = useStore();

  const myFormat = (num) => num + " sec";

  const removeRow = () => {
    actions.removeInstruction({
      instruction_id: props.instruction_id,
      node_id: props.node_id,
    });
  };

  const addRow = () => {
    let { instruction_id } = actions.addInstruction(props.role_id);
    actions.addInstructionId({
      node_id: props.node_id,
      instruction_id: instruction_id,
      prev_instruction_id: props.instruction_id,
      index: props.index,
    });
  };

  const changeType = (type) => {
    if (type === "video") {
      actions.setInstruction(props.instruction_id, {
        text: "",
        type,
      });
    } else {
      actions.setInstruction(props.instruction_id, {
        type,
      });
    }
  };

  const changeText = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
    actions.setInstruction(props.instruction_id, {
      text: e.target.value,
    });
  };

  const processVideo = async (e) => {
    const types = /(\.|\/)(mp4)$/i;
    if (!e.target) return;
    const file = e.target.files[0];
    if (!types.test(file.type) || !types.test(file.name)) return;
    let upload = await actions.processVideo(file, props.instruction_id);
    if (!upload.success) console.error(upload.error);
    actions.setInstruction(props.instruction_id, {
      text: `/api${upload.response.substring(1)}`,
      modified: new Date().getTime(),
    });
  };

  const getRoleOptions = createMemo(() =>
    Object.entries(state.script.roles)
      .filter(
        ([role_id, role]) => Object.keys(props.in_outs).indexOf(role_id) != -1
      )
      .map(([role_id, role]) => ({ label: role.name, value: role_id }))
  );

  return (
    <div
      classList={{
        row: true,
        flex: true,
        instruction: true,
        error: error_ref,
      }}

      // className={`row flex instruction ${getClassByRole()} ${getClassByError()}`}
    >
      <div
        className="instruction-border"
        style={{ background: getColorFromHue(props.role_hue) }}
      ></div>

      <Select
        options={getRoleOptions()}
        value={props.role_id}
        onInput={(value) =>
          actions.setInstruction(props.instruction_id, {
            role_id: value,
          })
        }
      ></Select>
      <Select
        options={[
          { value: "do", label: "do" },
          { value: "say", label: "say" },
          { value: "think", label: "think" },
          { value: "video", label: "video" },
        ]}
        value={props.type}
        onInput={changeType}
        className="tiny"
      ></Select>

      <div className="timer-container tiny">
        <input
          type="number"
          onChange={(e) =>
            actions.setInstruction(props.instruction_id, {
              timespan: e.target.value,
            })
          }
          min={0}
          step={5}
          precision={0}
          value={props.timespan ? props.timespan : 0}
          format={myFormat}
          className={!props.timespan ? "gray" : null}
        />
      </div>
      <div
        classList={{
          "timer-sound": true,
          tiny: true,
          on: props.sound,
        }}
      >
        <div>
          <label> 🕪 </label>
        </div>
        <div>
          <input
            type="checkbox"
            onChange={(e) =>
              actions.setInstruction(props.instruction_id, {
                sound: e.target.checked,
              })
            }
            checked={props.sound}
          ></input>
        </div>
      </div>

      <Show when={props.type === "video"}>
        <Show when={props.text === ""}>
          <input
            type="file"
            onChange={(e) => {
              processVideo(e);
            }}
            className="instruction-text flexing"
          ></input>
        </Show>
        <Show when={props.text !== ""}>
          <video className="flexing" src={urls.fetch + props.text}></video>
        </Show>
      </Show>
      <Show when={props.type !== "video"}>
        <input
          type={"text"}
          placeholder="enter instruction here"
          onInput={changeText}
          className={`instruction-text flexing`}
          value={props.text}
          // onInput={OnInput}
          // cols={4}
          rows={1}
        ></input>
      </Show>
      <button className="instruction-button tiny" onClick={() => removeRow()}>
        -
      </button>
      <button className="instruction-button tiny" onClick={() => addRow()}>
        +
      </button>
    </div>
  );
};
export default Instruction;

//            <video controls src={`${urls.fetch}${props.text}`} className="instruction-text flexing"></video> :
