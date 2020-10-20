import React, { useState, useEffect, useCallback, useRef } from 'react';
import './general.css';



const Instruction = ({ add, remove, change, props }) => {
  const didMountRef = useRef(false);
  let [role, setRole] = useState(props.role);
  const changeRole = (event) => {
    setRole(event.target.value);
  }
  let [type, setType] = useState(props.type);
  const changeType = (event) => {
    setType(event.target.value);
  }
  let [text, setText] = useState(props.text);
  const changeText = (event) => {
    setText(event.target.value);
  }

  const removeRow = () => {
    remove({instruction_id: props.instruction_id, role: role, type: type, text: text });
  }
  const addRow = () => {
    add({instruction_id: props.instruction_id, role: role, type: type, text: text });
  }

  const stableChange = useCallback(change, [])
  useEffect(() => {
    if (didMountRef.current)
      stableChange({instruction_id: props.instruction_id, role: role, type: type, text: text });
    else 
      didMountRef.current = true;
  }, [role, type, text, stableChange, props.instruction_id]);

  return (
    <div className={`row flex Instruction-container ${role === "a" ? "type_a" : "type_b"}`}>
      <div className="tiny">{props.index}</div>
      <select value={props.role} name="" onChange={changeRole} className="Instruction-role">
        <option value="a">A</option>
        <option value="b">B</option>
      </select>
      <select value={props.type} name="" onChange={changeType} className="Instruction-type">
        <option value="say">say</option>
        <option value="think">think</option>
        <option value="do">do</option>
      </select>
      <input value={props.text} type="text" placeholder="enter instruction here" onChange={changeText} className="Instruction-text flexing"></input>
      <button className="Instruction-button" onClick={() => removeRow()}>-</button>
      <button className="Instruction-button" onClick={() => addRow()}>+</button>
    </div>
  );
}
export default Instruction;