import { render } from "solid-js/web";
import { Router, Routes, Route } from "solid-app-router";

import "./index.css";
import App from "./App";

// render(App, document.getElementById("root"));

const isDev = true;
const urls = {
  mqtt: isDev ? "localhost:8883" : "socket.datingproject.net/mqtt",
  fetch: isDev
    ? "https://fetch.datingproject.net/test"
    : "https://fetch.datingproject.net",
  play: isDev ? "http://localhost:3001" : "https://play.datingproject.net",
  monitor: isDev
    ? "http://localhost:3004"
    : "https://monitor.datingproject.net",
};

render(
  () => (
    <Router>
      <Routes>
        <Route path="/:card_id" element={<App urls={urls} />} />
      </Routes>
    </Router>
  ),
  document.getElementById("root")
);
