import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import NumericInput from 'react-numeric-input';
import "./FileInput"

import {
  atom,
  useRecoilState
} from 'recoil';

const _instructionManager = atom({ key: 'instructionManager', default: '' });
const _videoUploader = atom({ key: 'videoUploader', default: '' });


const Instruction = (props) => {
  const r_data = useRef();
  const r_text = useRef();
  const r_timespan = useRef();

  let r_error = useRef(false);

  const [instructionManager] = useRecoilState(_instructionManager);
  const [videoUploader] = useRecoilState(_videoUploader);

  let [render, setRender] = useState();

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

  useEffect(() => {
    if (!r_timespan.current) return;
    if (r_timespan.current.value == parseInt(props.timespan)) return
    if (props.timespan != 0) console.log(r_timespan.current, props.timespan);
    r_timespan.current.value = parseInt(props.timespan);
  }, [props.timespan])

  useEffect(() => {
    if (!r_text.current) return;
    r_text.current.value = props.text.replace(/&#039;/g, "'")
  }, [props.text])

  const changeTimespan = useCallback((e) => {
    change('timespan', e);
  }, [])

  const changeType = useCallback((e) => {
    let type = e.target.value;
    if (type === 'video') change('text', '');
    change('type', type);
  }, [])

  // useEffect(() => { change('timespan', 0) }, [])

  const processVideo = useCallback(async (e) => {
    const types = /(\.|\/)(mp4)$/i;
    if (!e.target) return;
    const file = e.target.files[0];
    if (!types.test(file.type) || !types.test(file.name)) return;
    r_error.current = true;
    setRender(performance.now());
    let upload = await videoUploader.process(file, props.id);
    if (!upload.success) console.error(upload.error);
    setTimeout(() => {
      r_error.current = false;
      setRender(performance.now());
    }, 1000)

    change('text', `/api${upload.url.substring(1)}`);
  }, [])

  const myFormat = useCallback((num) => num + ' sec', []);
  const getClassByRole = useCallback(() => props.role_id === "a" ? "type_a" : "type_b", []);
  const getClassByError = useCallback(() => r_error.current ? "error" : "", []);

  return (
    <div className={`row flex instruction ${getClassByRole()} ${getClassByError()}`}>
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
      {
        props.type === 'video' ?
          props.text ?
            <video controls src={`${window._url.fetch}${props.text}`} className="instruction-text flexing"></video> :
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
export default memo(Instruction);