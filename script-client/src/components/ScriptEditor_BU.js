import React, { useRef, } from 'react';
import './ScriptEditor.css';
import Script from './Script';
// import "./general.css";
import { useHistory } from 'react-router-dom';
import SaveButton from "./SaveButton.js"

function ScriptEditor() {
    const childRef = useRef();
    const history = useHistory();

    return (
        <div className="App">
            <header className="Instruction-container row flex">
                <div className="tiny">#</div>
                <div>role</div>
                <div>type</div>
                <div className="flexing">instruction</div>
                <button onClick={() => history.push("/")} className="Instruction-button">all scripts</button>
                <button onClick={() => childRef.current.save()} className="Instruction-button">save</button>
                {/* <button onClick={() => history.push("/scripts/")} className="Instruction-button">test</button> */}
            </header>
            <Script ref={childRef}></Script>
        </div>
    );
}
export default ScriptEditor;