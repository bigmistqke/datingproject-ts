import { render } from "solid-js/web";
import { Router, Routes, Route } from "solid-app-router";

import "./css/general.css";

import Editor from "./routes/Editor";
import List from "./routes/List";
import Test from "./routes/Test";

const isDev = window.location.href.indexOf("localhost") != -1;
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
        <Route path="/:script_id" element={<Editor urls={urls} />} />
        <Route path="/scripts" element={<List urls={urls} />} />
        <Route path="/test/:room_url" element={<Test urls={urls} />} />
      </Routes>
    </Router>
  ),
  document.getElementById("root")
);
