import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import getData from "../helpers/getData";
import postData from "../helpers/postData";

import ScriptMap from './ScriptMap';

import SaveManager from './SaveManager';
import BlockManager from './BlockManager';
import InstructionManager from './InstructionManager';

import { RoleOverlay, ConfirmOverlay } from "./Overlays"


function decodeSingleQuotes(text) {
  return (text.replace(/&#039;/g, "'"));
}

let _base = 'http://localhost:8080'
// let _base = 'https://fetch.datingproject.net'

function ScriptEditor(props) {
  const history = useHistory();
  let r_blocks = useRef();
  let r_roles = useRef();
  let r_instructions = useRef();

  let r_saveManager = useRef();
  let r_instructionManager = useRef();
  let r_blockManager = useRef();

  let [ctrl, setCtrl] = useState(false);
  let [shift, setShift] = useState(false);

  let r_cursor = useRef();

  document.body.addEventListener('mousemove', (e) => { r_cursor.current = { x: e.clientX, y: e.clientY } });

  let { script_id } = useParams();
  let [blocks, setBlocks] = useState([]);
  let [roles, setRoles] = useState([]);
  let [instructions, setInstructions] = useState([]);

  let [connecting, setConnecting] = useState(false);
  let [roleOverlay, setRoleOverlay] = useState(false);
  let [deleteOverlay, setDeleteOverlay] = useState(false);
  // let [confirmRoleOverlay, setConfi] = useState(false);

  let [overlay, setOverlay] = useState(false);
  let r_overlays = useRef();

  useEffect(() => {
    console.log('hallo?');
    document.body.focus();
    // getData(`http://${process.env.REACT_APP_S_URL}/script/${script_id}`)
    getData(`${_base}/script/${script_id}`)

      // getData(`https://fetch.datingproject.net/script/${script_id}`)
      .then(res => res.json())
      .then(res => {
        console.log(res.blocks, res.instructions);
        r_blocks.current = res.blocks;
        r_roles.current = [{ role_id: 'a' }, { role_id: 'b' }];
        r_instructions.current = res.instructions;
        console.log(r_instructions.current);
        setBlocks(res.blocks);
        setInstructions(res.instructions);
        setRoles({ role_id: 'a' }, { role_id: 'b' });
      });
  }, [script_id]);


  const save = async () => {
    let roles = r_roles.current;

    r_saveManager.current.process(getBlocks(), getInstructions(), getRoles())

      .then(data => { console.log(data); return data })
      .then(data => postData(`${_base}/save`, { script_id, roles, ...data }))
      .then(res => res.json())
      .then(res => console.log(res));
  }

  const updateInstructions = (_instructions) => {
    console.log(_instructions);
    setInstructions(_instructions);
    r_instructions.current = _instructions;
    updateBlocks(getBlocks());
  }

  const updateBlocks = (_blocks) => {
    setBlocks(_blocks);
    r_blocks.current = _blocks;
  }

  const getInstructions = () => { return r_instructions.current; }
  const getBlocks = () => { return [...r_blocks.current]; }
  const getRoles = () => { return [...r_roles.current]; }

  useEffect(() => {
    r_saveManager.current = new SaveManager();
    r_instructionManager.current = new InstructionManager({
      getInstructions,
      updateInstructions,
      getBlocks,
      getRoles,
      updateBlocks,
      script_id
    });
    r_blockManager.current = new BlockManager(
      {
        script_id,
        getBlocks,
        getRoles,
        getInstructions,
        updateInstructions,
        updateBlocks,
        setConnecting,
        setRoleOverlay,
        setDeleteOverlay,
        setOverlay
      }
    );
    console.log(r_blockManager);
    // r_blockManager.current.addEventListener('update', (e) => { updateBlocks(e.detail.blocks) })
  }, [])

  const getOverlay = (overlay) => {
    console.log("THIS HAPPENS");
    let data = overlay.data;
    let type = overlay.type;
    console.log(overlay);
    switch (type) {
      case 'role':
        return <RoleOverlay position={r_cursor.current} data={data} resolve={overlay.resolve}></RoleOverlay>;
      case 'confirm':
        return <ConfirmOverlay position={r_cursor.current} data={data} resolve={overlay.resolve}></ConfirmOverlay>;
      default:
        break;
    }
  }

  const keyUp = (e) => {
    setCtrl(false);
  }
  const keyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      setCtrl(true);
    }
    if (e.shiftKey) {
      setShift(true);
    }
  }

  useEffect(() => {
    document.body.addEventListener("keydown", keyDown);
    document.body.addEventListener("keyup", keyUp);
  }, [])


  return (
    <div className="App" >

      <header className="row fixed flex">
        <div className="flexing">editor for script {script_id}</div>
        <button onClick={() => history.push("/")} className="Instruction-button">all scripts</button>
        <button onClick={() => history.push("/")} className="Instruction-button">roles</button>
        <button onClick={() => save()} className="Instruction-button">save</button>
      </header>

      {overlay ? <div className="overlay-container" onMouseDown={() => { overlay.resolve(false) }}>{getOverlay(overlay)}</div> : null}

      {/* {roleOverlay ? <RoleOverlay block={roleOverlay.block} position={roleOverlay.position} roles={roleOverlay.roles} blockManager={r_blockManager.current}></RoleOverlay> : null} */}

      <ScriptMap
        instructionManager={r_instructionManager.current}
        blockManager={r_blockManager.current}
        blocks={blocks}
        instructions={r_instructions.current}

        r_blocks={r_blocks.current}
        script_id={script_id}
        connecting={connecting}
        allRoles={roles}
      ></ScriptMap>

    </div >
  );
}
export default ScriptEditor;