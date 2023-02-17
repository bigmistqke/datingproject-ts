import { render } from "solid-js/web";
import { Router, Routes, Route } from "solid-app-router";
import { Provider } from "./store/Store";

import "./index.css";
import App from "./App";

// render(App, document.getElementById("root"));

render(
  () => (
    <Provider>
      <Router>
        <Routes>
          <Route path="/:design_id" element={<App />} />
        </Routes>
      </Router>
    </Provider>
  ),
  document.getElementById("root")
);
