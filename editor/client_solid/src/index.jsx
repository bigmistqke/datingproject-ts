import { render } from "solid-js/web";
import { Router, Routes, Route } from "solid-app-router";

import "./css/general.css";

import Editor from "./routes/Editor";
import List from "./routes/List";
import Test from "./routes/Test";

import { Provider } from "./managers/Store";

render(
  () => (
    <Provider>
      <Router>
        <Routes>
          <Route path="/:script_id" element={<Editor />} />
          <Route path="/scripts" element={<List />} />
          <Route path="/test/:room_url" element={<Test />} />
        </Routes>
      </Router>
    </Provider>
  ),
  document.getElementById("root")
);
