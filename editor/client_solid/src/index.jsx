import { render } from "solid-js/web";
import { Router, Routes, Route } from "solid-app-router";

import "./css/general.css";

import Editor from "./routes/Editor";
import List from "./routes/List";
import Test from "./routes/Test";

import { Provider } from "./managers/Store";

render(
  () => (
    <Router>
      <Provider>
        <Routes>
          <Route path="/:script_id" element={<Editor />} />
          <Route path="/:script_id/*parent_ids" element={<Editor />} />
          <Route path="/scripts" element={<List />} />
          <Route path="/test/:room_url" element={<Test />} />
        </Routes>
      </Provider>
    </Router>
  ),
  document.getElementById("root")
);
