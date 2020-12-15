import React, { UseEffect } from "react";
import paper from "paper";

import {
  BrowserRouter as Router,
  Route, Switch
} from "react-router-dom";

import Script from "./components/Script"
import Home from "./routes/Home"

import "./css/general.css";


function App() {
  /* 
      window.onload = function () {
          paper.install(window);
          // paper.setup("paper-canvas");
      }; */

  return (
    <Router>
      <Switch>
        <Route path="/:script_id/:pair_id?">
          <Script >

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