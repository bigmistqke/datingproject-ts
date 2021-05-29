import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
    atom,
    useRecoilState
} from 'recoil';
import NumericInput from 'react-numeric-input';
// import { useBeforeunload } from 'react-beforeunload';


import copy from 'copy-to-clipboard';

import getData from "../helpers/getData";
import postData from "../helpers/postData";

import Map from '../components/Map';
import ProgressBars from '../components/ProgressBars';

import DataProcessor from '../managers/DataProcessor';
import BlockManager from '../managers/BlockManager';
import InstructionManager from '../managers/InstructionManager';
import VideoUploader from '../managers/VideoUploader';

import Overlays from "../components/Overlays"

const _instructionManager = atom({ key: 'instructionManager', default: '' });
const _blockManager = atom({ key: 'blockManager', default: '' });
const _videoUploader = atom({ key: 'videoUploader', default: false });
// const _setRender = atom({ key: 'setRender', default: performance.now() });


// const _overlayManager = atom({ key: 'overlayManager', default: '' });

function decodeSingleQuotes(text) {
    return (text.replace(/&#039;/g, "'"));
}

window.cursorPosition = {};
window.addEventListener('mousemove', e => {
    window.cursorPosition = { x: e.clientX, y: e.clientY };
})



function Editor({ socket, user_id }) {
    const history = useHistory();

    const { script_id } = useParams();

    const r_saveButton = useRef();



    const [ctrl, setCtrl] = useState(false);
    const [shift, setShift] = useState(false);
    const [roles, setRoles] = useState([]);
    const [connecting, setConnecting] = useState(false);
    const [overlay, setOverlay] = useState(false);

    const [render, setRender] = useState(0);
    const [instructionManager, setInstructionManager] = useRecoilState(_instructionManager);
    const [blockManager, setBlockManager] = useRecoilState(_blockManager);
    const [videoUploader, setVideoUploader] = useRecoilState(_videoUploader);

    const [blocks, setBlocks] = useState([]);

    const r_blocks = useRef([]);
    const r_roles = useRef([]);
    const r_instructions = useRef([0, 1]);
    const r_dataProcessor = useRef();
    const r_errors = useRef({});
    const r_blockManager = useRef();
    const r_cursor = useRef();
    const hasChanges = useRef(false);
    const r_please = useRef();


    const openOverlay = async function ({ type, data }) {
        return new Promise((_resolve) => {
            const resolve = (data) => {
                _set.overlay(false);
                _resolve(data);
            }
            const position = {
                x: window.cursorPosition.x,
                y: window.cursorPosition.y
            }
            _set.overlay({ type, data, position, resolve })
        })
    }

    const getOverlay = (overlay) => {
        // return OverlayManager.get(overlay.type, overlay);
        return Overlays[overlay.type](overlay);
    }
    function throttle(func, timeFrame) {
        var lastTime = 0;
        return function () {
            var now = new Date();
            if (now - lastTime >= timeFrame) {
                func();
                lastTime = now;
            }
        };
    }


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
            hasChanges.current = true;
            // setBlocks(_blocks);
            throttle(setRender(performance.now()), 10);

            // setRender(performance.now())

        },
        instructions: (_instructions) => {
            r_instructions.current = _instructions;
            throttle(setRender(performance.now()), 10);
            hasChanges.current = true;
        },
        roles: (_roles) => {
            r_roles.current = _roles;
            throttle(setRender(performance.now()), 10);
            hasChanges.current = true;
        },
        errors: (_errors) => {
            r_errors.current = _errors;
            setRender(performance.now());
        },
        connecting: (bool) => setConnecting(bool),
        overlay: (bool) => setOverlay(bool)
    }

    // useBeforeunload((event) => 'ok?');


    useEffect(() => {
        if (!videoUploader) return

        window.addEventListener('beforeunload', (e) => {
            if (!videoUploader.isUploading() && !hasChanges.current) return
            e.preventDefault();
            // if (!videoUploader.isUploading()) return
            alert('please wait until all videos are uploaded');
        })
    }, [videoUploader])

    const init = () => {

        r_dataProcessor.current = new DataProcessor();

        setBlockManager(new BlockManager({ _get, _set, script_id, visualizeErrors, openOverlay }));
        setInstructionManager(new InstructionManager({ _get, _set, script_id }));
        setVideoUploader(new VideoUploader({ script_id }));
        // updateBlocks([...blocks]);


        document.body.addEventListener('mousemove', (e) => { r_cursor.current = { x: e.clientX, y: e.clientY } });


        getData(`${window._url.fetch}/api/get/${script_id}`)
            .then(res => res.json())
            .then(res => {
                if (!res) return Promise.reject('errrr');
                _set.instructions(res.instructions);
                _set.blocks(res.blocks);
                console.log(Object.keys(res.roles));
                _set.roles(Object.keys(res.roles));
                hasChanges.current = false;
            })
            .catch(err => {
                r_instructions.current = {};
                r_blocks.current = [];
                r_roles.current = ["1", "2"];
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
            //console.log(data);
        } catch (e) {
            console.error(e);
        }
    }

    const visualizeErrors = async () => {
        let check = await r_dataProcessor.current.checkConnections({ ..._get.all() });
        //console.log(check);
        let _errors = {};
        if (!check.success) {
            _errors = check.errors;
        }
        _set.errors(_errors);
    }

    const test = useCallback(async () => {
        try {
            //console.log('_get.all: ', _get.all());
            const processed_data = await r_dataProcessor.current.process({ safe: true, ..._get.all() });
            if (!processed_data.success) return
            let result = await postData(`${window._url.fetch}/api/test/${script_id}`, processed_data);
            const { roles, room_url, error } = await result.json();
            if (error) console.error(error);


            let options = {};
            for (let role of roles) {
                options[role.role_id] = ['open link', 'share link'];
            }

            options['combo'] = ['open link']

            const callback = async (data) => {
                if (!data) {
                    setOverlay(false);
                }
                if (data.title === 'combo') {
                    let url = `${window.location.protocol + '//' + window.location.host}/test/${room_url}`;
                    window.open(url)

                } else {
                    const { title: role_id, option } = data;
                    const role_url = roles.find(v => v.role_id === role_id).role_url;
                    let url = `${window._url.play}/${room_url}${role_url}`;
                    switch (option) {
                        case 'open link':
                            window.open(url)
                            break;
                        case 'share link':
                            copy(url);
                    }
                }

            }
            _set.overlay({
                type: 'option_groups',
                data: { title: 'open/share the test urls', options }
                , resolve: callback
            })
        } catch (e) {
            console.error(e);
        }
    }, [])

    const save = useCallback(async () => {
        let data = await r_dataProcessor.current.process({ safe: false, ..._get.all() });
        if (!data.success) return
        r_saveButton.current.innerHTML = 'saving...';
        data = await postData(`${window._url.fetch}/api/save/${script_id}`, { ...data });
        setTimeout(() => {
            r_saveButton.current.innerHTML = 'saved!';
            setTimeout(() => {
                r_saveButton.current.innerHTML = 'save';
            }, 2000);
        }, 1000)
        hasChanges.current = false;
    }, [])

    const publish = useCallback(async () => {
        //console.log(_get.all());
        let data = await r_dataProcessor.current.process({ safe: true, ..._get.all() });
        //console.log(data);
        if (!data.success) return
    }, [])


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

    const changeRoles = useCallback(value => {
        let roles = [];
        for (let i = 0; i < value; i++) {
            roles.push(String(i + 1));
        }
        _set.roles(roles)
    }, [])

    const myFormat = useCallback((num) => num + ' roles', []);

    useEffect(() => {
        if (!r_roles.current) return;

        //console.log(r_roles.current);
    })

    return (
        <div className="App" >
            <header className="row fixed flex">
                <div className="flexing">editor for script {script_id}</div>
                {/* <button onClick={() => visualizeErrors()} className="Instruction-button">debug</button> */}
                <NumericInput
                    // ref={r_timespan}
                    type='number'
                    onChange={changeRoles}
                    min={2}
                    step={1}
                    precision={0}
                    strict={true}
                    value={r_roles.current ? r_roles.current.length : 2}
                    format={myFormat}
                />

                <button onClick={test} className="Instruction-button">test</button>
                <button onClick={save} ref={r_saveButton} className="Instruction-button">save</button>
                <button onClick={publish} className="Instruction-button">publish</button>
            </header>
            {
                overlay ?
                    <div
                        className="overlay-container"
                        onMouseDown={(e) => { if (Array.from(e.target.classList).indexOf('overlay-container') != -1) overlay.resolve(false) }}
                    >
                        {getOverlay(overlay)}
                    </div> : null
            }

            <Map
                instructions={r_instructions.current}
                // blocks={r_blocks.current}
                blocks={r_blocks.current}
                roles={r_roles.current}
                script_id={script_id}
                connecting={connecting}
                errors={r_errors.current}
            ></Map>
            <ProgressBars></ProgressBars>
        </div >
    );
}
export default Editor;