import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
ReactDOM.render(
  <React.StrictMode>
    <Router>
      <Switch>
        <Route path="/:card_id">
          <App />
          <div className="background"><div ></div></div>
        </Route>
      </Switch>
    </Router>

  </React.StrictMode>,
  document.getElementById('root')
);
