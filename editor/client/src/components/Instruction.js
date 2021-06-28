import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import NumericInput from 'react-numeric-input';
// import 
import Select from 'react-select';

import "./FileInput"


const Instruction = (props) => {
  const r_data = useRef();
  const r_text = useRef();
  const r_timespan = useRef();

  const role_ref = useRef();

  let r_error = useRef(false);

  let [render, setRender] = useState();

  let [type, setType] = useState();
  let [role, setRole] = useState();
  let [sound, setSound] = useState();

  const removeRow = () => {
    props.blockManager.removeInstruction(props.block_id, props.id);
  }
  const addRow = () => {
    let { instruction_id, instruction } = props.blockManager.addInstruction({ block_id: props.block_id, prev_instruction_id: props.id, role_id: props.role_id, });
    props.addRow({ instruction_id, instruction })
  }

  const change = useCallback((type, value) => {
    r_data.current[type] = value;
    props.instructionManager.change(props.id, r_data.current);
  }, [props.instructionManager]);

  useEffect(() => {
    r_data.current = { role_id: props.role_id, type: props.type };
  }, [props]);

  useEffect(() => {
    if (!r_timespan.current) return;
    if (r_timespan.current.value == parseInt(props.timespan)) return
    if (props.timespan != 0) ////console.log(r_timespan.current, props.timespan);
      r_timespan.current.value = parseInt(props.timespan);
  }, [props.timespan])

  useEffect(() => {
    if (!r_text.current || !props.text) return;
    r_text.current.value = props.text.replace(/&#039;/g, "'")
  }, [props.text])

  const changeTimespan = useCallback((e) => {
    change('timespan', e);
  }, [props.instructionManager])

  const changeRole = useCallback((e) => {
    change('role_id', e);
    // setRole(e);
  }, [props.instructionManager])

  const changeType = useCallback((e) => {
    let type = e.target.value;
    if (type === 'video') change('text', '');
    // setType(type);

    change('type', type);
  }, [props.instructionManager])

  const changeSound = useCallback((e) => {
    const sound = e.target.checked;
    change('sound', sound);
    setSound(sound);
  }, [])

  useEffect(() => {
    setType(props.type);
  }, [props.type])

  useEffect(() => {
    setRole(props.role_id);
  }, [props.role_id])



  // useEffect(() => { change('timespan', 0) }, [])

  const processVideo = useCallback(async (e) => {
    const types = /(\.|\/)(mp4)$/i;
    if (!e.target) return;
    const file = e.target.files[0];
    if (!types.test(file.type) || !types.test(file.name)) return;
    r_error.current = true;
    setRender(performance.now());
    let upload = await props.videoUploader.process(file, props.id);
    if (!upload.success) console.error(upload.error);
    setTimeout(() => {
      r_error.current = false;
      setRender(performance.now());
    }, 1000)

    change('text', `/api${upload.url.substring(1)}`);
  }, [])

  useEffect(() => {
    //console.log(props.type);
  }, [props.type])

  useEffect(() => {
    console.log('props.text is' + props.text);
  }, [props.text])

  useEffect(() => {
    //console.log('sound : ', props.sound);
    setSound(props.sound);
  }, [props.sound])


  useEffect(() => {
    setTimeout(() => {
      if (!role_ref.current) return;
      if (props.role_id !== role_ref.current.value) {
        console.error('ERROR!!');

        change('role_id', role_ref.current.value);
      }
    }, 1000)

  }, [])

  const myFormat = useCallback((num) => num + ' sec', []);
  const getClassByRole = useCallback(() => props.role_id === "a" ? "type_a" : "type_b", []);
  const getClassByError = useCallback(() => r_error.current ? "error" : "", []);

  return (
    <div className={`row flex instruction ${getClassByRole()} ${getClassByError()}`}>
      <div className="instruction-order tiny">{props.index}</div>
      <select ref={role_ref} value={role} name=""
        onChange={(e) => { changeRole(e.target.value) }}
        className="instruction-role">
        {props.connections.map((c) => {
          return <option key={c.role_id} value={c.role_id}>{c.role_id}</option>
        })}

      </select>
      <select value={type} name=""
        onChange={changeType}
        className="instruction-type">
        <option value="do">action</option>
        <option value="say">speech</option>
        <option value="think">thought</option>
        <option value="video">video</option>
      </select>


      <div className="timer-container">
        <NumericInput
          // ref={r_timespan}
          type='number'
          onChange={changeTimespan}
          min={0}
          step={5}
          precision={0}
          value={props.timespan ? props.timespan : 0}
          format={myFormat}
          className={!props.timespan ? 'gray' : null}
        />
      </div>
      <div className={`timer-sound ${sound ? 'on' : ''}`}>
        <label> 🕪 </label>
        <input type='checkbox' onChange={changeSound} checked={sound}></input>
      </div>
      {
        type === 'video' ?
          props.text ?
            <video className='flexing' src={window._url.fetch + props.text}></video> :
            <input type="file" onChange={(e) => { processVideo(e) }} className="instruction-text flexing"></input> :
          <input
            ref={r_text}
            type={"text"}
            placeholder="enter instruction here"
            onChange={(e) => { change('text', e.target.value); }}
            className={`instruction-text flexing`}></input>

      }

      <button className="instruction-button tiny" onClick={() => removeRow()}>-</button>
      <button className="instruction-button tiny" onClick={() => addRow()}>+</button>
    </div >
  );
}

function blockPropsAreEqual(prev, next) {
  return prev.text === next.text &&
    prev.type === next.type &&
    prev.connections === next.connections &&
    prev.timespan === next.timespan &&
    prev.role_id === next.role_id &&
    prev.render === next.render;
}

export default memo(Instruction, blockPropsAreEqual);

//            <video controls src={`${window._url.fetch}${props.text}`} className="instruction-text flexing"></video> :
