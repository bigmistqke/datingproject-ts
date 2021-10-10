import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './css/general.css';
import Editor from './routes/Editor';
import List from './routes/List';
import Test from './routes/Test';

import * as serviceWorker from './serviceWorker';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import {
    RecoilRoot
} from 'recoil';
import uniqid from 'uniqid';

import Mqtt from "./helpers/Mqtt.js"

const isDev = window.location.href.indexOf('localhost') !== -1;

window._url = {
    mqtt: isDev ? "localhost:8883" : "socket.datingproject.net/mqtt",
    fetch: isDev ? "http://localhost:8080" : "https://fetch.datingproject.net",
    play: isDev ? "http://localhost:3001" : "https://play.datingproject.net",
    monitor: isDev ? "http://localhost:3004" : "https://monitor.datingproject.net",
}

function App() {
    // var socket = useRef();
    let user_id = uniqid();
    const [socket, setSocket] = useState();

    async function initSocket() {
        let _socket = await new Mqtt(window._url.mqtt, true, window.location.protocol.indexOf('https') != -1);
        ////console.log(_socket);
        setSocket(_socket);
    }

    let init = () => {
        initSocket();
    }

    useEffect(() => {
        init();
    }, []);

    return (
        <RecoilRoot>
            <Router>
                <Switch>
                    <Route path="/test/:room_url">
                        <Test />
                        <div className="background"><div ></div></div>
                    </Route>
                    <Route path="/:script_id">
                        <Editor socket={socket} user_id={user_id} />
                        <div className="background"><div ></div></div>
                    </Route>
                    <Route path="/">
                        <List />
                        <div className="background"><div ></div></div>
                    </Route>

                </Switch>
            </Router>
        </RecoilRoot>
    );
}

export default App;