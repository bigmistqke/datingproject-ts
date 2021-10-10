import { render } from "solid-js/web";
import { Router, Routes, Route } from "solid-app-router";

import './css/general.css';


import Editor from './routes/Editor';
import List from './routes/List';


render(
    () => (
        <Router>
            <Routes>
                <Route path="/:script_id" element={<Editor />} />
                <Route path="/scripts" element={<List />} />

            </Routes>
        </Router >
    ),
    document.getElementById("root")
);
