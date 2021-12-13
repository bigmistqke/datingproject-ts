import React, { useRef, useEffect, useState } from "react";
// import paper from "paper";

import {
  BrowserRouter as Router,
  Route, Switch
} from "react-router-dom";

import uniqid from 'uniqid';

import Mqtt from "./Mqtt.js"
import Game from "./routes/Game"
import Home from "./routes/Home"
import "./css/general.css";
import "./css/card.css";

import urls from "./urls";

function App() {

  // var socket = useRef();
  let user_id = uniqid();
  const [socket, setSocket] = useState();

  async function initSocket() {
    let _socket = await new Mqtt(urls.socket, true, true);
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
        <Route path="/:game_url/:unsafe?">
          <Game socket={socket} user_id={user_id}>

          </Game>
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