import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
  atom,
  useRecoilState
} from 'recoil';

import getData from "../helpers/getData";
import postData from "../helpers/postData";

import Map from './Map';

import DataProcessor from './DataProcessor';
import BlockManager from './BlockManager';
import InstructionManager from './InstructionManager';

import Overlays from "./Overlays"

const _instructionManager = atom({ key: 'instructionManager', default: '' });
const _blockManager = atom({ key: 'blockManager', default: '' });
const _roles = atom({ key: 'roles', default: '' });
const _blocks = atom({ key: 'blocks', default: '' });
const _instructions = atom({ key: 'instructions', default: '' });

function decodeSingleQuotes(text) {
  return (text.replace(/&#039;/g, "'"));
}

function ScriptEditor({ socket, user_id }) {
  const history = useHistory();
  const r_blocks = useRef();
  const r_roles = useRef();
  const r_instructions = useRef();

  const r_dataProcessor = useRef();

  const [instructionManager, setInstructionManager] = useRecoilState(_instructionManager);
  const [blockManager, setBlockManager] = useRecoilState(_blockManager);

  const [roles, setRoles] = useRecoilState(_roles);
  const [blocks, setBlocks] = useRecoilState(_blocks);
  const [instructions, setInstructions] = useRecoilState(_instructions);


  const r_blockManager = useRef();

  const [ctrl, setCtrl] = useState(false);
  const [shift, setShift] = useState(false);

  const r_cursor = useRef();

  document.body.addEventListener('mousemove', (e) => { r_cursor.current = { x: e.clientX, y: e.clientY } });

  const { script_id } = useParams();
  // const [blocks, setBlocks] = useState([]);
  // let [roles, setRoles] = useState([]);
  const [connecting, setConnecting] = useState(false);
  const [render, setRender] = useState(performance.now());

  const [overlay, setOverlay] = useState(false);



  /*  const updateBlocks = (_blocks) => {
     r_blocks.current = _blocks;
     setBlocks(performance.now());
   } */


  const _get = {
    instructions: () => { return { ...r_instructions.current } },
    blocks: () => [...r_blocks.current],
    roles: () => [...r_roles.current],
    all: () => {
      return {
        instructions: _get.instructions(),
        blocks: _get.blocks(),
        roles: _get.roles()
      }
    }
  }

  const _set = {
    blocks: (_blocks) => {
      r_blocks.current = _blocks;
      setRender(performance.now());
    },
    instructions: (_instructions) => {
      r_instructions.current = _instructions;
      setRender(performance.now());
    },
    roles: (_roles) => {
      r_roles.current = _roles;
      setRoles(_roles);
    },
    connecting: (bool) => setConnecting(bool),
    overlay: (bool) => setOverlay(bool)
  }

  const init = () => {

    r_dataProcessor.current = new DataProcessor();

    setBlockManager(new BlockManager({ _get, _set, script_id }));
    setInstructionManager(new InstructionManager({ _get, _set, script_id }));

    // updateBlocks([...blocks]);

    getData(`${window._url.fetch}/script/${script_id}`)
      .then(res => res.json())
      .then(res => {
        if (!res) return Promise.reject('errrr');
        console.log(res);
        _set.instructions(res.instructions);
        _set.blocks(res.blocks);
        _set.roles([{ role_id: 'a' }, { role_id: 'b' }]);
      })
      .catch(err => {
        r_instructions.current = {};
        r_blocks.current = [];
        r_roles.current = [{ role_id: 'a' }, { role_id: 'b' }];
      });
  }

  const initMqtt = () => {
    if (!socket) return
    socket.subscribe(`/usr/${user_id}/connected`, () => {
      socket.subscribe(`/editor/${script_id}/update`, updateData);
    })
    socket.send('/connect', JSON.stringify({ user_id, script_id }));
    window.addEventListener('beforeunload', () => {
      socket.send('/disconnect', JSON.stringify({ user_id, script_id }));
    })
  }

  // placeholder for update over mqtt
  const updateData = (data) => {
    try {
      let data = JSON.parse(data);
      console.log(data);
    } catch (e) {
      console.error(e);
    }
  }

  const error_checker = () => {

  }

  const test = async () => {
    console.log(_get.all());
    let data = await r_dataProcessor.current.process(_get.all());
    if (!data.success) return
    console.log('testing!0');
    data = await postData(`${window._url.fetch}/api/save/test`, { script_id, ...data })
    console.log(data);
    /* data = postData(`${window._url.fetch}/api/save/test`, { script_id, ...data })
      .then(data => {
        if (!data.success) Promise.reject()
        return data
      })
      .then(data => )
      .then(res => res.json())
      .then(data => {
        if (!data.success) Promise.reject()
        return postData(`${window._url.fetch}/api/createRoom/${script_id}`)
      })
      .catch(err => {
        console.log(err);
      }) */
  }

  const save = async () => {
    r_dataProcessor.current.process(_get.all())
      .then(data => {
        if (!data.success) {
          return Promise.reject()
        }
        return data
      })
      .then(data => postData(`${window._url.fetch}/api/save/final`, { script_id, ...data }))
      .then(res => res.json())
      .then(res => console.log(res))
      .catch(err => {
        console.log(err);
        // alert('error!')
      })
  }

  const publish = async () => {

  }

  const getOverlay = (overlay) => {
    return Overlays[overlay.type](overlay);
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


  useEffect(init, [script_id]);

  useEffect(initMqtt, [socket])

  return (
    <div className="App" >
      <header className="row fixed flex">
        <div className="flexing">editor for script {script_id}</div>
        <button onClick={() => test()} className="Instruction-button">test</button>
        <button onClick={() => save()} className="Instruction-button">save</button>
        <button onClick={() => publish()} className="Instruction-button">publish</button>
      </header>
      {
        overlay ?
          <div
            className="overlay-container"
            onMouseDown={() => { overlay.resolve(false) }}
          >
            {getOverlay(overlay)}
          </div> : null
      }

      <Map
        instructions={r_instructions.current}
        blocks={r_blocks.current}
        roles={roles}
        script_id={script_id}
        connecting={connecting}
      ></Map>
    </div >
  );
}
export default ScriptEditor;