import React from 'react';
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

import App from "./App"

import {
  RecoilRoot,
} from 'recoil';

import { } from 'dotenv/config';

ReactDOM.render(

  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
