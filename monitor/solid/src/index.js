import { render } from 'solid-js/web';
// import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import { Route, Router, Routes } from "solid-app-router";

render((
  <Router>
    <Routes>
      <Route path="/:script_id" element={<App />} />
    </Routes>
  </Router>
), document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
