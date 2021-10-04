import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

const isDev = window.location.href.indexOf('localhost') != -1;

window._url = {
  mqtt: isDev ? "localhost:8883" : "socket.datingproject.net/mqtt",
  editor: isDev ? "http://localhost:3000" : "https://script.datingproject.net",
  fetch: isDev ? "http://localhost:8080" : "https://fetch.datingproject.net",
  play: isDev ? "http://localhost:3001" : "https://play.datingproject.net",
  monitor: isDev ? "http://localhost:3004" : "https://monitor.datingproject.net",
}





ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Switch>
        <Route path="/:script_id">
          <App />
          <div className="background"><div ></div></div>
        </Route>
      </Switch>
    </Router>

  </React.StrictMode>,
  document.getElementById('root')
);
