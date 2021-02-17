import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './css/general.css';
import ScriptEditor from './components/ScriptEditor';
import ScriptList from './components/ScriptList';
import * as serviceWorker from './serviceWorker';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import uniqid from 'uniqid';

import Mqtt from "./Mqtt.js"

const isDev = window.location.href.indexOf('localhost') != -1;


// window._url.fetch = isDev ? "http://localhost:8080" : "https://fetch.datingproject.net";

window._url = {
    mqtt: isDev ? "localhost:8883" : "socket.datingproject.net/mqtt",
    fetch: isDev ? "http://localhost:8080" : "https://fetch.datingproject.net"
}


function App() {

    // var socket = useRef();
    let user_id = uniqid();
    const [socket, setSocket] = useState();

    async function initSocket() {
        let _socket = await new Mqtt(window._url.mqtt, true, window.location.protocol.indexOf('https') != -1);
        console.log(_socket);
        setSocket(_socket);
    }
    let init = () => {
        initSocket();
    }


    useEffect(() => {
        init();
    }, []);

    return (
        <Router>
            <Switch>
                <Route path="/:script_id">
                    <ScriptEditor socket={socket} user_id={user_id} />
                    <div className="background"><div ></div></div>
                </Route>
                <Route path="/">
                    <ScriptList />
                    <div className="background"><div ></div></div>
                </Route>
            </Switch>

        </Router>

    );
}

export default App;