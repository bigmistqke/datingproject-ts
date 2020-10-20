import React, { useEffect, useState } from 'react';
import getData from '../helpers/getData';
import socketIOClient from "socket.io-client";
import { useParams, useHistory } from "react-router-dom";
import BubbleCanvas from "./BubbleCanvas";

let current = {};
const ENDPOINT = "http://127.0.0.1:4001";
let socket = null;

console.log("OK?");

function escapeHtml(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }
  function decodeSingleQuotes(text){
      return text.replace(/&#039;/g, "'");
  }

const ScriptPlayer = () => {

    let { script_id, pair_id } = useParams();
    let [role_id, setRole] = useState();
    let [instruction, setInstruction] = useState();
    let [type, setType] = useState();
    let [isTurn, setTurn] = useState();

    const history = useHistory();

    useEffect(() => {
        async function getScript() {
            return getData(`http://localhost:8080/script/${script_id}`)
                .then(res => res.json())
                .then(script => {
                    script.sort((a, b) => { return a.instruction_order - b.instruction_order })
                    return script;
                });
        }
        function ScriptReader(script, index) {
            console.log(`NEW SCR  I PTREADER ${script} ${index}`);
            this.script = script;
            this.index = index;
            this.play = () => {
                console.log(this.index);
                console.log(this.script);
                console.log(this.script[index]);
                if (this.script[this.index].role === socket.role_id) {
                    setType(this.script[this.index].type);
                    setInstruction(decodeSingleQuotes(this.script[this.index].text));
                    setTurn(true);

                } else {
                    console.log("wait for your turn");
                    setTurn(false);
                    setInstruction("wait for your turn");
                    setType("wait");

                }
            }
            this.playAt = (index) => {
                this.index = index;
                this.play();
            }

            this.playNext = () => {
                this.index++;
                socket.emit("playAt", this.index);
                this.play();
            }
        }


        socket = socketIOClient(ENDPOINT);
        if (!pair_id) {
            socket.emit("findPair", script_id);
        } else {
            console.log("HALLO!");
            socket.emit("pairClient", [script_id, pair_id]);
        }
        socket.on("initScript", ({role_id, script_index}) => {
            console.log("INIT SCRIPT ");
            socket.script_id = script_id;
            socket.pair_id = pair_id;
            socket.role_id = role_id;
            console.log(role_id );
            if (typeof role_id === 'string') {
                setRole(role_id);
                current.role_id = role_id;
                getScript().then((script) => {
                    current.scriptReader = new ScriptReader(script, script_index);
                    current.scriptReader.play();
                    // playScript(script, 0)
                });
            } else {
                console.log("THIS SHOUT HAPPEN?");
                setRole("ROOM IS FULL!!! WANT TO CREATE NEW ROOM?")
            }
        })

        socket.on("log", allClients => {
            console.log(allClients);
        });
        socket.on("click", data => {
            console.log(data);
        });
        socket.on("playAt", (index) => {
            console.log(index);
            current.scriptReader.playAt(index);
        })
        socket.on("isPaired", data => {
            console.log("role_id is " + data.role_id);
            let pair_present = pair_id ? true : false;
            pair_id = data.pair_id;
            setRole(data.role_id);
            if (!pair_present) {
                history.push(`${script_id}/${pair_id}`);
            }
        });
        socket.on("otherGone", data => {
            console.log("other dude left " + data);
        });


    }, []);

    useEffect(() => {

    })

    const changeShape = (thisType) => {
        switch (thisType) {
            case "think":
                return <img src="http://localhost/react-test/think.svg"></img>
        }
    }

    return <div className="instruction">
        <span className="text">{instruction}</span>
        {isTurn ? <button className="next" onClick={() => { current.scriptReader.playNext() }}>NEXT</button> : false}
        {/* {changeShape(type)} */}
        {}
        <canvas id="paper-canvas"></canvas>
        <BubbleCanvas type={type}></BubbleCanvas>
    </div>
}

export default ScriptPlayer;