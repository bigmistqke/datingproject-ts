// import React, { useState, useEffect, useRef, memo, useCallback } from 'react';

import NumericInput from "./NumericInput";
// import
// import Select from 'react-select';

import { createSignal } from "solid-js";

const Instruction = (props) => {
  let role_ref;
  let input_ref;
  let error_ref;

  const removeRow = () => {
    props.storeManager.instructions.removeInstruction({
      block_id: props.block_id,
      instruction_id: props.instruction_id,
    });
    props.storeManager.blocks.removeInstructionId({
      block_id: props.block_id,
      instruction_id: props.instruction_id,
    });
  };

  const addRow = () => {
    let { instruction_id } =
      props.storeManager.script.instructions.addInstruction({
        block_id: props.block_id,
        role_id: props.role_id,
      });
    props.storeManager.script.blocks.addInstructionId({
      block_id: props.block_id,
      instruction_id: instruction_id,
      prev_instruction_id: props.instruction_id,
    });
  };

  const changeTimespan = (value) => {
    props.storeManager.instructions.change(props.instruction_id, {
      timespan: value,
    });
  };

  const changeRole = (value) => {
    props.storeManager.instructions.change(props.instruction_id, {
      role_id: value,
    });
  };

  const changeType = (value) => {
    let type = e.target.value;
    if (type === "video") {
      props.storeManager.instructions.change(props.instruction_id, {
        text: "",
        type: value,
      });
    } else {
      props.storeManager.instructions.change(props.instruction_id, {
        type: value,
      });
    }
  };

  const changeSound = (e) => {
    props.storeManager.instructions.change(props.instruction_id, {
      sound: e.target.checked,
    });
  };

  const changeText = (e) => {
    props.storeManager.instructions.change(props.instruction_id, {
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

    props.storeManager.instructions.change(props.instruction_id, {
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
          onChange={changeText}
          className={`instruction-text flexing`}
          value={props.text}
        ></input>
      );
    }
  };

  return (
    <div
      className={`row flex instruction ${getClassByRole()} ${getClassByError()}`}
    >
      <div className="instruction-order tiny">{props.index}</div>
      <select
        ref={role_ref}
        value={props.role_id}
        name=""
        onChange={(e) => {
          changeRole(e.target.value);
        }}
        className="instruction-role"
      >
        {props.roles.map((c) => {
          return (
            <option key={c.role_id} value={c.role_id}>
              {c.role_id}
            </option>
          );
        })}
      </select>
      <select
        value={props.type}
        name=""
        onChange={changeType}
        className="instruction-type"
      >
        <option value="do">action</option>
        <option value="say">speech</option>
        <option value="think">thought</option>
        <option value="video">video</option>
      </select>

      <div className="timer-container">
        <NumericInput
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
      <div className={`timer-sound ${props.sound ? "on" : ""}`}>
        <label> 🕪 </label>
        <input
          type="checkbox"
          onChange={changeSound}
          checked={props.sound}
        ></input>
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
