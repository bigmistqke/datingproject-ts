import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import _Mqtt from "./modules/_Mqtt.js";

const isDev = window.location.href.indexOf('localhost') != -1;

window._url = {
  mqtt: isDev ? "localhost:8883" : "socket.datingproject.net/mqtt",
  fetch: isDev ? "http://localhost:8080" : "https://fetch.datingproject.net"
}

let _mqtt = new _Mqtt();
_mqtt.connect(window._url.mqtt);


ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Switch>
        <Route path="/:script_id">
          <App _mqtt={_mqtt} />
          <div className="background"><div ></div></div>
        </Route>
      </Switch>
    </Router>

  </React.StrictMode>,
  document.getElementById('root')
);
