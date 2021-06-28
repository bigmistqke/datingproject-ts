import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import {
    atom,
    useRecoilState
} from 'recoil';
import NumericInput from 'react-numeric-input';
// import { useBeforeunload } from 'react-beforeunload';
import Iframe from 'react-iframe'

import State from "../helpers/react/State.js";

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

import flatten, { unflatten } from 'flat';



function decodeSingleQuotes(text) {
    return (text.replace(/&#039;/g, "'"));
}

window.cursorPosition = {};
window.addEventListener('mousemove', e => {
    window.cursorPosition = { x: e.clientX, y: e.clientY };
})



window.unflatten = unflatten;
window.flatten = flatten;


function Editor({ socket, user_id }) {
    const history = useHistory();

    const { script_id } = useParams();

    const r_saveButton = useRef();

    const connecting = new State(false);
    const [render, setRender] = useState();


    const r_instructionManager = useRef();
    const r_videoUploader = useRef();
    const r_blockManager = useRef();
    const r_dataProcessor = useRef();

    const blocks = new State([]);
    const roles = new State([1, 2]);
    const instructions = new State({});



    const connections = new State([]);
    const origin = new State({ x: 0, y: 0 });
    const zoom = new State(1);

    const overlay = new State();
    const errors = new State({});
    const initialized = new State(false);

    const r_cursor = useRef();

    const hasChanges = useRef(false);

    const openOverlay = async function ({ type, data }) {
        return new Promise((_resolve) => {
            const resolve = (data) => {
                overlay.set(false);
                _resolve(data);
            }
            const position = {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2
            }
            overlay.set({ type, data, position, resolve })
        })
    }

    const getOverlay = (overlay) => {

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

    useEffect(() => {
        if (!r_videoUploader.current) return
        window.addEventListener('beforeunload', (e) => {
            if (!r_videoUploader.current.isUploading() && !hasChanges.current) return
            e.preventDefault();
            alert('please wait until all videos are uploaded');
        })
    }, [r_videoUploader])

    const init = () => {

        r_blockManager.current = new BlockManager({ connections, origin, blocks, zoom, instructions, roles, connecting, script_id, visualizeErrors, openOverlay });
        r_instructionManager.current = new InstructionManager({ blocks, instructions, roles, script_id });

        r_dataProcessor.current = new DataProcessor({ blockManager: r_blockManager.current });
        r_videoUploader.current = new VideoUploader({ script_id });

        document.body.addEventListener('mousemove', (e) => { r_cursor.current = { x: e.clientX, y: e.clientY } });

        getData(`${window._url.fetch}/api/script/get/${script_id}`)
            .then(res => res.json())
            .then(res => {
                if (!res) return Promise.reject('error fetching data ', res);
                instructions.set(res.instructions);
                blocks.set(res.blocks);
                //console.log(res.roles);
                roles.set(Object.keys(res.roles));
                hasChanges.current = false;
            })
            .catch(err => {
                instructions.set({});
                blocks.set([]);
                roles.set([1, 2]);
            });

        initialized.set(true);
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
        } catch (e) {
            console.error(e);
        }
    }

    const visualizeErrors = async () => {
        //console.log('visualizeErrors');

        let check = await r_dataProcessor.current.checkConnections({ instructions: instructions.get(), blocks: blocks.get(), roles: roles.get() });
        //console.log('visualizeErrors', check);

        let _errors = {};
        if (!check.success) {
            _errors = check.errors;
        }
        errors.set(_errors);
        // _set.errors(_errors);
    }

    const test = useCallback(async () => {
        try {
            const processed_data = await r_dataProcessor.current.process({ safe: true, instructions: instructions.get(), blocks: blocks.get(), roles: roles.get() });
            if (!processed_data.success) return
            //console.log(processed_data);
            let result = await postData(`${window._url.fetch}/api/script/test/${script_id}`, processed_data);
            const { roles: _roles, room_url, error } = await result.json();
            if (error) console.error(error);


            let options = {};
            for (let role of Object.values(_roles)) {
                options[role.role_id] = ['open link', 'share link'];
            }

            options['combo'] = ['open link']

            const callback = async (data) => {
                if (!data) {
                    overlay.set(false);
                }
                if (data.title === 'combo') {
                    let url = `${window.location.protocol + '//' + window.location.host}/test/${room_url}`;
                    window.open(url)

                } else {
                    const { title: role_id, option } = data;
                    const role_url = Object.entries(_roles).find(([role_url, role]) => role.role_id === role_id)[0];
                    let url = `${window._url.play}/${room_url}${role_url}`;
                    switch (option) {
                        case 'open link':
                            window.open(url)
                            break;
                        case 'share link':
                            copy(url);
                            break;
                        default:
                            break;
                    }
                }

            }
            overlay.set({
                type: 'option_groups',
                data: { title: 'open/share the test urls', options }
                , resolve: callback
            })
        } catch (e) {
            console.error(e);
        }
    }, [])

    const save = useCallback(async () => {
        let data = await r_dataProcessor.current.process({ safe: false, instructions: instructions.get(), blocks: blocks.get(), roles: roles.get() });
        if (!data.success) {
            //console.log('save', data);
            return;
        }
        if (data.errors) {
            //console.log('errors', data.errors);
            errors.set(data.errors);
        }
        console.log('data', data);
        r_saveButton.current.innerHTML = 'saving...';
        data = await postData(`${window._url.fetch}/api/script/save/${script_id}`, { ...data });
        setTimeout(() => {
            r_saveButton.current.innerHTML = 'saved!';
            setTimeout(() => {
                r_saveButton.current.innerHTML = 'save';
            }, 2000);
        }, 1000)
        hasChanges.current = false;
    }, [])



    useEffect(init, [script_id]);

    useEffect(initMqtt, [socket])

    const changeRoles = useCallback(value => {

        let _roles = [];
        for (let i = 0; i < value; i++) {
            _roles.push(String(i + 1));
        }
        roles.set(_roles)
    }, [roles])





    const format = useCallback((num) => num + ' roles', []);

    return (
        <div className="App" >
            {initialized ?
                <>
                    {
                        overlay.get() ?
                            <div
                                className="overlay-container"
                                onMouseDown={(e) => { if (Array.from(e.target.classList).indexOf('overlay-container') != -1) overlay.get().resolve(false) }}
                            >
                                {getOverlay(overlay.get())}
                            </div> : null
                    }
                    <div className='viewport'>
                        <div className="panel">
                            <header className="row absolute flex">
                                <h1 className="flexing">editor for script {script_id}</h1>
                                <NumericInput
                                    type='number'
                                    onChange={changeRoles}
                                    min={2}
                                    step={1}
                                    precision={0}
                                    strict={true}
                                    value={roles.get() ? roles.get().length : 2}
                                    format={format}
                                />

                                <button onClick={test} className="Instruction-button">test</button>
                                <button onClick={test} className="Instruction-button">active games</button>
                                <button onClick={save} ref={r_saveButton} className="Instruction-button">save</button>
                            </header>
                            <Map
                                instructions={instructions.get()}

                                blocks={blocks}

                                roles={roles.get()}
                                connections={connections.get()}

                                zoom={zoom.get()}
                                setZoom={zoom.set}
                                getZoom={zoom.get}

                                origin={origin.get()}
                                getOrigin={origin.get}
                                setOrigin={origin.set}

                                script_id={script_id}
                                connecting={connecting.get()}
                                errors={errors}
                                blockManager={r_blockManager.current}
                                instructionManager={r_instructionManager.current}
                                videoUploader={r_videoUploader.current}

                                render={render}
                            ></Map>
                        </div>

                        {/* <Iframe url={window._url.gamemaster}> </Iframe> */}
                    </div>

                    <ProgressBars videoUploader={r_videoUploader.current}></ProgressBars>
                </> : null
            }

        </div>
    );
}
export default Editor;