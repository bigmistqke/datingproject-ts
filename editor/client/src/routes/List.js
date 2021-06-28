import React, { useEffect, useState } from 'react';
// import "./general.css";
import { useHistory } from 'react-router-dom';
import getData from "../helpers/getData";

// import {NormalCard} from "./card/CardTemplates.js"

let current = {};

function List() {
  let [scripts, setScripts] = useState([]);
  const history = useHistory();
  useEffect(() => {
    getData("https://fetch.datingproject.net/scripts")
      .then(res => res.json())
      .then(res => {
        ////console.log(res);
        current.scripts = res;
        setScripts(res);
      });
  }, [])

  const clickHandler = (link) => {
    ////console.log(link);
    history.push(link);
  }

  return (
    <div className="App">
      <header className="row">
        All Scripts
      </header>
      {scripts.map((script) => {
        let link = `/${script.script_id}`;
        let title = script.script_id;
        return <button onClick={() => { clickHandler(link) }} className="block relative-center scriptButton" key={title}>{title}</button>
      })}
    </div>
  );
}
export default List;