import React, { useEffect, useState } from 'react';
import "./general.css";
import { useHistory } from 'react-router-dom';
import getData from "../helpers/getData";

let current = {};

function ScriptList() {
  let [scripts, setScripts] = useState([]);
  const history = useHistory();
  useEffect(() => {
    getData("http://localhost:8080/scripts")
      .then(res => res.json())
      .then(res => {
        console.log(res);
        current.scripts = res;
        setScripts(res);
      });
  }, [])

  const clickHandler = (link) => {
    console.log(link);
    history.push(link);
  }

  return (
    <div className="App">
      <header className="row center">
        All Scripts
      </header>
      {scripts.map((script) => {
        let link = `/script/${script.script_id}`;
        let title = script.script_id;
        return <button onClick={()=>{clickHandler(link)}} className="row center" key={title}>{title}</button>
      })}
    </div>
  );
}
export default ScriptList;