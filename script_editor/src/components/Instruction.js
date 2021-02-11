import React, { useState, useEffect, useRef } from 'react';
import './general.css';
import "./FileInput"


//{ add, remove, change, data, connections }
const Instruction = (props) => {
  const didMountRef = useRef(false);
  let noConnections = useRef(false);
  let r_data = useRef();




  const removeRow = () => {
    props.instructionManager.remove(props.block_id, props.id);
  }
  const addRow = () => {
    props.instructionManager.add({ block_id: props.block_id, prev_instruction_id: props.id, role_id: props.role_id, });
  }

  const change = (type, value) => {
    console.log(type, value);
    console.log(r_data.current);
    r_data.current[type] = value;
    props.instructionManager.change(props.id, r_data.current);
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
    let upload = await props.instructionManager.uploadVideo(file, props.id);
    if (!upload.success) console.error(upload.error);
    change('text', `/api${upload.url.substring(1)}`);
  }

  const changeType = (e) => {
    let type = e.target.value;
    if (type === 'video') change('text', '');
    change('type', type);
  }

  return (
    <div className={`row flex instruction ${props.role_id === "a" ? "type_a" : "type_b"}`}>
      <div className="instruction-order tiny">{props.data.index}</div>
      <select value={props.role_id} name=""
        onChange={(e) => { change('role_id', e.target.value) }}
        className="instruction-role">
        {props.connections.map((c) => {
          return <option key={c.role_id} value={c.role_id}>{c.role_id}</option>
        })}

      </select>
      <select value={props.data.type} name=""
        onChange={changeType}
        className="instruction-type">
        <option value="say">speech</option>
        <option value="think">thought</option>
        <option value="do">action</option>
        <option value="idle">idle</option>
        <option value="video">video</option>

      </select>
      {
        props.data.type === 'video' ?
          props.data.text ?
            <video src={`${window._base}${props.data.text}`} className="instruction-text flexing"></video> :
            <input type="file" onChange={(e) => { processVideo(e) }} className="instruction-text flexing"></input> :
          <input value={props.data.text.replace(/&#039;/g, "'")}
            type={"text"}
            placeholder="enter instruction here"
            onChange={(e) => { change('text', e.target.value) }}
            className="instruction-text flexing"></input>
      }
      <button className="instruction-button tiny" onClick={() => removeRow()}>-</button>
      <button className="instruction-button tiny" onClick={() => addRow()}>+</button>
    </div >
  );
}
export default Instruction;