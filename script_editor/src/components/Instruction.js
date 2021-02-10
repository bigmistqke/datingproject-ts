import React, { useState, useEffect, useRef } from 'react';
import './general.css';


//{ add, remove, change, data, connections }
const Instruction = (props) => {
  const didMountRef = useRef(false);
  let noConnections = useRef(false);
  let r_data = useRef();




  const removeRow = () => {
    props.instructionManager.remove(props.block_id, props.instruction_id);
  }
  const addRow = () => {
    props.instructionManager.add({ block_id: props.block_id, instruction_id: props.instruction_id, role_id: props.role_id, });
  }

  const change = (type, value) => {
    console.log(r_data.current);
    r_data.current[type] = value;
    props.instructionManager.change(props.id, r_data.current);
  }

  useEffect(() => {
    r_data.current = { role_id: props.role_id, type: props.type };
  }, [props]);

  return (
    <div className={`row flex instruction ${props.role_id === "a" ? "type_a" : "type_b"}`}>
      <div className="instruction-order tiny">{props.data.index}</div>
      <select value={props.role_id} name="" onChange={(e) => { change('role_id', e.target.value) }} className="instruction-role">
        {props.connections.map((c) => {
          return <option key={c.role_id} value={c.role_id}>{c.role_id}</option>
        })}

      </select>
      <select value={props.data.type} name="" onChange={(e) => { change('type', e.target.value) }} className="instruction-type">
        <option value="say">speech</option>
        <option value="think">thought</option>
        <option value="do">action</option>
        <option value="do">idle</option>
        <option value="do">neutral</option>
      </select>
      <input value={props.data.text.replace(/&#039;/g, "'")} type="text" placeholder="enter instruction here" onChange={(e) => { change('text', e.target.value) }} className="instruction-text flexing"></input>
      <button className="instruction-button tiny" onClick={() => removeRow()}>-</button>
      <button className="instruction-button tiny" onClick={() => addRow()}>+</button>
    </div>
  );
}
export default Instruction;