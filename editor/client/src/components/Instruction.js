import React, { useState, useEffect, useRef } from 'react';
import './general.css';
import "./FileInput"

import {
  atom,
  useRecoilState
} from 'recoil';

const _instructionManager = atom({
  key: 'instructionManager', // unique ID (with respect to other atoms/selectors)
  default: '', // default value (aka initial value)
});


const Instruction = (props) => {
  const r_data = useRef();
  const r_text = useRef();

  const [instructionManager] = useRecoilState(_instructionManager);




  const removeRow = () => {
    instructionManager.remove(props.block_id, props.id);
  }
  const addRow = () => {
    instructionManager.add({ block_id: props.block_id, prev_instruction_id: props.id, role_id: props.role_id, });
  }

  const change = (type, value) => {
    r_data.current[type] = value;
    instructionManager.change(props.id, r_data.current);
  }

  useEffect(() => {
    r_data.current = { role_id: props.role_id, type: props.type };
  }, [props]);

  const processVideo = async (e) => {
    const types = /(\.|\/)(mp4)$/i;
    if (!e.target) return;
    const file = e.target.files[0];
    if (!types.test(file.type) || !types.test(file.name)) return;

    change('text', URL.createObjectURL(file));
    let upload = await instructionManager.uploadVideo(file, props.id);
    if (!upload.success) console.error(upload.error);
    change('text', `/api${upload.url.substring(1)}`);
  }

  const changeType = (e) => {
    let type = e.target.value;
    if (type === 'video') change('text', '');
    change('type', type);
  }

  useEffect(() => {
    console.log('ole');
    if (!r_text.current) return;
    r_text.current.value = props.text.replace(/&#039;/g, "'")
  }, [props.text])

  return (
    <div className={`row flex instruction ${props.role_id === "a" ? "type_a" : "type_b"}`}>
      <div className="instruction-order tiny">{props.index}</div>
      <select value={props.role_id} name=""
        onChange={(e) => { change('role_id', e.target.value) }}
        className="instruction-role">
        {props.connections.map((c) => {
          return <option key={c.role_id} value={c.role_id}>{c.role_id}</option>
        })}

      </select>
      <select value={props.type} name=""
        onChange={changeType}
        className="instruction-type">
        <option value="say">speech</option>
        <option value="think">thought</option>
        <option value="do">action</option>
        <option value="idle">idle</option>
        <option value="video">video</option>

      </select>
      {
        props.type === 'video' ?
          props.text ?
            <video src={`${window._url.fetch}${props.text}`} className="instruction-text flexing"></video> :
            <input type="file" onChange={(e) => { processVideo(e) }} className="instruction-text flexing"></input> :
          <input
            ref={r_text}
            type={"text"}
            placeholder="enter instruction here"
            // onClick={onClickHandler}
            onChange={(e) => { change('text', e.target.value); }}
            className="instruction-text flexing"></input>

      }
      <button className="instruction-button tiny" onClick={() => removeRow()}>-</button>
      <button className="instruction-button tiny" onClick={() => addRow()}>+</button>
    </div >
  );
}
export default Instruction;