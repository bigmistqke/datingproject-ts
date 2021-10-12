// import React, { useState, useEffect, useRef, memo, useCallback } from 'react';

import NumericInput from "./NumericInput";
// import
// import Select from 'react-select';
import "./Instruction.css";
import { createSignal, onMount, createEffect } from "solid-js";
import Select from "./Select";
import getColorFromHue from "../helpers/getColorFromHue";

const Instruction = (props) => {
  let role_ref;
  let input_ref;
  let error_ref;

  const removeRow = () => {
    props.storeManager.script.instructions.remove(props.instruction_id);
    props.storeManager.script.blocks.removeInstructionId({
      block_id: props.block_id,
      instruction_id: props.instruction_id,
    });
  };

  const addRow = () => {
    let { instruction_id } = props.storeManager.script.instructions.add(
      props.role_id
    );
    props.storeManager.script.blocks.addInstructionId({
      block_id: props.block_id,
      instruction_id: instruction_id,
      prev_instruction_id: props.instruction_id,
    });
  };

  const changeTimespan = (e) => {
    let timespan = e.target.value;
    props.storeManager.script.instructions.change(props.instruction_id, {
      timespan,
    });
  };

  const changeRole = (value) => {
    props.storeManager.script.instructions.change(props.instruction_id, {
      role_id: value,
    });
  };

  const changeType = (type) => {
    // let type = e.target.value;
    if (type === "video") {
      props.storeManager.script.instructions.change(props.instruction_id, {
        text: "",
        type,
      });
    } else {
      props.storeManager.script.instructions.change(props.instruction_id, {
        type,
      });
    }
  };

  const changeSound = (e) => {
    props.storeManager.script.instructions.change(props.instruction_id, {
      sound: e.target.checked,
    });
  };

  const changeText = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
    props.storeManager.script.instructions.change(props.instruction_id, {
      text: e.target.value,
    });
  };

  const processVideo = async (e) => {
    const types = /(\.|\/)(mp4)$/i;
    if (!e.target) return;
    const file = e.target.files[0];
    if (!types.test(file.type) || !types.test(file.name)) return;
    error_ref = true;
    let upload = await props.videoUploader.process(file, props.instruction_id);
    if (!upload.success) console.error(upload.error);
    setTimeout(() => {
      error_ref = false;
    }, 1000);

    props.storeManager.script.instructions.change(props.instruction_id, {
      text: `/api${upload.url.substring(1)}`,
    });
  };

  const myFormat = (num) => num + " sec";
  const getClassByRole = () => (props.role_id === "a" ? "type_a" : "type_b");
  const getClassByError = () => (error_ref ? "error" : "");

  const InstructionValue = () => {
    if (props.type === "video") {
      if (props.text) {
        return (
          // <div></div>
          <video
            className="flexing"
            src={props.urls.fetch + props.text}
          ></video>
        );
      } else {
        return (
          <input
            type="file"
            onChange={(e) => {
              processVideo(e);
            }}
            className="instruction-text flexing"
          ></input>
        );
      }
    } else {
      return (
        <input
          ref={input_ref}
          type={"text"}
          placeholder="enter instruction here"
          onInput={changeText}
          className={`instruction-text flexing`}
          value={props.text}
          // onInput={OnInput}
          // cols={4}
          rows={1}
        ></input>
      );
    }
  };

  const getRoleId = () => props.role_id;

  return (
    <div
      className={`row flex instruction ${getClassByRole()} ${getClassByError()}`}
      // style={{ background: `hsl(${props.role_hue}, 100%, 97%)` }}
    >
      <div
        className="instruction-border"
        style={{ background: getColorFromHue(props.role_hue) }}
      ></div>

      {/* <span>{props.role_id}</span> */}
      <Select
        options={Object.keys(props.roles)}
        value={props.role_id}
        onInput={changeRole}
        className="tiny"
      ></Select>
      <Select
        options={["do", "say", "think", "video"]}
        value={props.type}
        onInput={changeType}
        className="tiny"
      ></Select>

      <div className="timer-container tiny">
        <input
          // ref={r_timespan}
          type="number"
          onChange={changeTimespan}
          min={0}
          step={5}
          precision={0}
          value={props.timespan ? props.timespan : 0}
          format={myFormat}
          className={!props.timespan ? "gray" : null}
        />
      </div>
      <div className={`timer-sound tiny ${props.sound ? "on" : ""}`}>
        <div>
          <label> 🕪 </label>
        </div>
        <div>
          <input
            type="checkbox"
            onChange={changeSound}
            checked={props.sound}
          ></input>
        </div>
      </div>
      <InstructionValue></InstructionValue>
      <button className="instruction-button tiny" onClick={() => removeRow()}>
        -
      </button>
      <button className="instruction-button tiny" onClick={() => addRow()}>
        +
      </button>
    </div>
  );
};

function blockPropsAreEqual(prev, next) {
  return (
    prev.text === next.text &&
    prev.type === next.type &&
    prev.ports === next.ports &&
    prev.timespan === next.timespan &&
    prev.role_id === next.role_id &&
    prev.render === next.render
  );
}

export default Instruction;

//            <video controls src={`${props.urls.fetch}${props.text}`} className="instruction-text flexing"></video> :
