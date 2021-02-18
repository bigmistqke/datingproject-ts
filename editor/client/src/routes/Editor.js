import React, { useState, useEffect, useRef, useContext } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
    atom,
    useRecoilState
} from 'recoil';

import getData from "../helpers/getData";
import postData from "../helpers/postData";

import Map from '../components/Map';

import DataProcessor from '../managers/DataProcessor';
import BlockManager from '../managers/BlockManager';
import InstructionManager from '../managers/InstructionManager';
import VideoUploader from '../managers/VideoUploader';

import Overlays from "../components/Overlays"

const _instructionManager = atom({ key: 'instructionManager', default: '' });
const _blockManager = atom({ key: 'blockManager', default: '' });
const _videoUploader = atom({ key: 'videoUploader', default: '' });

function decodeSingleQuotes(text) {
    return (text.replace(/&#039;/g, "'"));
}



function Editor({ socket, user_id }) {
    const history = useHistory();
    const r_blocks = useRef();
    const r_roles = useRef();
    const r_instructions = useRef();

    const r_dataProcessor = useRef();

    const [instructionManager, setInstructionManager] = useRecoilState(_instructionManager);
    const [blockManager, setBlockManager] = useRecoilState(_blockManager);
    const [videoUploader, setVideoUploader] = useRecoilState(_videoUploader);

    const r_errors = useRef({});

    const r_blockManager = useRef();

    const [ctrl, setCtrl] = useState(false);
    const [shift, setShift] = useState(false);

    const r_cursor = useRef();

    document.body.addEventListener('mousemove', (e) => { r_cursor.current = { x: e.clientX, y: e.clientY } });

    const { script_id } = useParams();
    // const [blocks, setBlocks] = useState([]);
    let [roles, setRoles] = useState([]);
    const [connecting, setConnecting] = useState(false);
    const [render, setRender] = useState(performance.now());

    const [overlay, setOverlay] = useState(false);


    const _get = {
        instructions: () => { return { ...r_instructions.current } },
        blocks: () => [...r_blocks.current],
        roles: () => [...r_roles.current],
        errors: () => [...r_errors.current],
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
            setRender(performance.now());
        },
        errors: (_errors) => {
            r_errors.current = _errors;
            setRender(performance.now());
        },

        connecting: (bool) => setConnecting(bool),
        overlay: (bool) => setOverlay(bool)
    }

    const init = () => {

        r_dataProcessor.current = new DataProcessor();

        setBlockManager(new BlockManager({ _get, _set, script_id, visualizeErrors }));
        setInstructionManager(new InstructionManager({ _get, _set, script_id }));
        setVideoUploader(new VideoUploader({ script_id }));

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


    // }

    const visualizeErrors = async () => {
        let check = await r_dataProcessor.current.checkConnections({ ..._get.all() });
        let _errors = {};
        if (!check.success) {
            _errors = check.errors;
        }
        _set.errors(_errors);
    }

    const test = async () => {
        let data = await r_dataProcessor.current.process({ safe: true, ..._get.all() });
        console.log(data);
        if (!data.success) return
        data = await postData(`${window._url.fetch}/api/save/${script_id}/test`, data);
        const room = await postData(`${window._url.fetch}/api/createRoom/${script_id}/test`);
        room = await room.json();

    }

    const save = async () => {
        let data = await r_dataProcessor.current.process({ safe: false, ..._get.all() });
        if (!data.success) return
        data = await postData(`${window._url.fetch}/api/save/${script_id}/temp`, { ...data });
    }

    const publish = async () => {
        console.log(_get.all());
        let data = await r_dataProcessor.current.process({ safe: true, ..._get.all() });
        console.log(data);
        if (!data.success) return
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
                {/* <button onClick={() => visualizeErrors()} className="Instruction-button">debug</button> */}
                {/* <button onClick={() => test()} className="Instruction-button">test</button> */}
                <button onClick={() => save()} className="Instruction-button">save</button>
                {/* <button onClick={() => publish()} className="Instruction-button">publish</button> */}
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
                roles={r_roles.current}
                script_id={script_id}
                connecting={connecting}
                errors={r_errors.current}
            ></Map>
        </div >
    );
}
export default Editor;