import React, { useRef, useEffect } from "react";
// import paper from "paper";

import {
  BrowserRouter as Router,
  Route, Switch
} from "react-router-dom";


import Mqtt from "./Mqtt.js"
import Script from "./components/Script"
import Home from "./routes/Home"

import "./css/general.css";

// const ENDPOINT = "https://socket.datingproject.net";
const isDev = true;

const _url = {
  mqtt: isDev ? "localhost" : "https://mqtt.datingproject.net",
  socket: isDev ? "http://localhost:4001" : "https://play.datingproject.net",
  fetch_url: isDev ? "http://localhost:8080" : "https://fetch.datingproject.net"
}




function App() {

  var socket = useRef();


  async function initSocket() {
    console.log('trying!');

    socket.current = await new Mqtt(_url.mqtt, true);
    console.log('connected!', socket.current);
    socket.current.subscribe('/test', (msg) => { console.log(msg) });
    socket.current.send('/test', 'hallo');
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
    setTimeout(() => {
      init();
    }, 1000);
  }, []);
  /* 
      window.onload = function () {
          paper.install(window);
          // paper.setup("paper-canvas");
      }; */

  return (
    <Router>
      <Switch>
        <Route path="/:script_id/:pair_id?">
          <Script _url={_url}>

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