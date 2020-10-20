import React from "react";
import {
  BrowserRouter as Router,
  Route, Switch
} from "react-router-dom";

import ScriptPlayer from "./components/ScriptPlayer"
import "./css/general.css";
function App() {





  return (
    <Router>
      <Switch>
        <Route path="/script/:script_id/:pair_id?">
          <ScriptPlayer></ScriptPlayer>
        </Route>
      </Switch>
    </Router>
  );
}

export default App;