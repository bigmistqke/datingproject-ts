import React, { useRef, useEffect, useState } from "react";
// import paper from "paper";

import {
  BrowserRouter as Router,
  Route, Switch
} from "react-router-dom";

import uniqid from 'uniqid';

import Mqtt from "./Mqtt.js"
import Script from "./components/Script"
import Home from "./routes/Home"

import "./css/general.css";

const isDev = window.location.href.indexOf('localhost') != -1;

window._url = {
  mqtt: isDev ? "localhost:8883" : "socket.datingproject.net/mqtt",
  fetch: isDev ? "http://localhost:8080" : "https://fetch.datingproject.net"
}




function App() {

  // var socket = useRef();
  let user_id = uniqid();
  const [socket, setSocket] = useState();

  async function initSocket() {
    console.log('trying!');
    console.log(window.location.protocol);
    let _socket = await new Mqtt(window._url.mqtt, true, window.location.protocol.indexOf('https') != -1);
    console.log(_socket);
    setSocket(_socket);
    /* 
    socket.current.subscribe('wat', (msg) => { console.log(msg) });
  
    socket.current.send('test', 'hallo'); */


    /*  socket.current = socketIOClient(ENDPOINT, {
         transports: ['websocket', 'polling']
     }); */
  }
  let init = () => {
    initSocket();
    // initInstructions();
  }


  useEffect(() => {
    init();
  }, []);
  /* 
      window.onload = function () {
          paper.install(window);
          // paper.setup("paper-canvas");
      }; */

  return (
    <Router>
      <Switch>
        <Route path="/:script_id/:room_id?">
          <Script socket={socket} user_id={user_id}>

          </Script>
          <div className="background"><div ></div></div>
        </Route>
        <Route path="/">
          <Home></Home>
          <div className="background"><div ></div></div>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;