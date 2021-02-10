import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import getData from "../helpers/getData";
import postData from "../helpers/postData";

// import './ScriptEditor.css';
import ScriptMap from './ScriptMap';

import SaveManager from './SaveManager';
import NodeManager from './NodeManager';
import InstructionManager from './InstructionManager';

/* import RoleOverlay from "./RoleOverlay"
import ConfirmRoleOverlay from "./ConfirmRoleOverlay" */
import { RoleOverlay, ConfirmOverlay } from "./Overlays"


function decodeSingleQuotes(text) {
  return (text.replace(/&#039;/g, "'"));
}

let _base = 'http://localhost:8080'
// let _base = 'https://fetch.datingproject.net'

function ScriptEditor(props) {
  const history = useHistory();
  let r_nodes = useRef();
  let r_roles = useRef();

  let r_saveManager = useRef();
  let r_instructionManager = useRef();
  let r_nodeManager = useRef();

  let [ctrl, setCtrl] = useState(false);
  let [shift, setShift] = useState(false);

  let r_cursor = useRef();

  document.body.addEventListener('mousemove', (e) => { r_cursor.current = { x: e.clientX, y: e.clientY } });

  let { script_id } = useParams();
  let [nodes, setNodes] = useState([]);
  let [roles, setRoles] = useState([]);

  let [connecting, setConnecting] = useState(false);
  let [roleOverlay, setRoleOverlay] = useState(false);
  let [deleteOverlay, setDeleteOverlay] = useState(false);
  // let [confirmRoleOverlay, setConfi] = useState(false);

  let [overlay, setOverlay] = useState(false);
  let r_overlays = useRef();

  useEffect(() => {
    document.body.focus();
    // getData(`http://${process.env.REACT_APP_S_URL}/script/${script_id}`)
    getData(`${_base}/script/${script_id}`)

      // getData(`https://fetch.datingproject.net/script/${script_id}`)
      .then(res => res.json())
      .then(res => {
        console.log(res.nodes);
        r_nodes.current = res.nodes;
        r_roles.current = [{ role_id: 'a' }, { role_id: 'b' }]
        setNodes(res.nodes);
        setRoles({ role_id: 'a' }, { role_id: 'b' });

      });
  }, [script_id]);


  const save = async () => {
    let roles = r_roles.current;

    r_saveManager.current.process(getNodes(), getRoles())

      .then(data => { console.log(data); return data })
      .then(data => postData(`${_base}/save`, { script_id, roles, ...data }))
      .then(res => res.json())
      .then(res => console.log(res));
  }

  const updateNodes = (_nodes) => {
    // console.log('update those fucking nodes');
    setNodes(_nodes);
    r_nodes.current = _nodes;
  }

  const getNodes = () => { return [...r_nodes.current]; }
  const getRoles = () => { return [...r_roles.current]; }

  useEffect(() => {
    r_saveManager.current = new SaveManager();
    r_instructionManager.current = new InstructionManager({
      getNodes,
      getRoles,
      updateNodes,
      script_id
    });
    r_nodeManager.current = new NodeManager(
      {
        script_id,
        getNodes,
        getRoles,
        updateNodes,
        setConnecting,
        setRoleOverlay,
        setDeleteOverlay,
        setOverlay
      }
    );
    console.log(r_nodeManager);
    // r_nodeManager.current.addEventListener('update', (e) => { updateNodes(e.detail.nodes) })
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

      {/* {roleOverlay ? <RoleOverlay node={roleOverlay.node} position={roleOverlay.position} roles={roleOverlay.roles} nodeManager={r_nodeManager.current}></RoleOverlay> : null} */}

      <ScriptMap
        instructionManager={r_instructionManager.current}
        nodeManager={r_nodeManager.current}
        nodes={nodes}
        r_nodes={r_nodes.current}
        script_id={script_id}
        connecting={connecting}
        allRoles={roles}
      ></ScriptMap>

    </div >
  );
}
export default ScriptEditor;