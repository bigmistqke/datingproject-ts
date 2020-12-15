import React, { useEffect, useState } from 'react';
import getData from '../helpers/getData';
import socketIOClient from "socket.io-client";
import { useParams, useHistory } from "react-router-dom";
import BubbleCanvas from "./BubbleCanvas";
/* let current = {};
const ENDPOINT = "https://socket.datingproject.net";
let socket = null; */

console.log("OK?");

function decodeSingleQuotes(text) {
    return text.replace(/&#039;/g, "'");
}



const ScriptPlayer = () => {
    current.swiping = false;

    let { script_id, pair_id } = useParams();
    let [role_id, setRole] = useState();
    let [instruction, setInstruction] = useState();
    let [type, setType] = useState();
    let [isTurn, setTurn] = useState();

    const history = useHistory();

    useEffect(() => {
        async function getScript() {
            return getData(`https://fetch.datingproject.net/script/${script_id}`)
                .then(res => res.json())
                .then(script => {
                    script.sort((a, b) => { return a.instruction_order - b.instruction_order })
                    return script;
                });
        }
        function ScriptReader(script, index) {
            console.log(`NEW SCR  I PTREADER ${script} ${index}`);
            this.play = () => {
                if (this.script[this.index].role === socket.role_id) {
                    setType(this.script[this.index].type);
                    setInstruction(decodeSingleQuotes(this.script[this.index].text));
                    setTurn(true);
                } else {
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


        


    }, []);

    useEffect(() => {

    })


    return <div className="instruction" >
            <span className="text">{instruction}</span>
            {isTurn ? <button className="next" onClick={() => { current.scriptReader.playNext() }}>NEXT</button> : false}
            {/* {changeShape(type)} */}
            {}
            <canvas id="paper-canvas"></canvas>
            <BubbleCanvas type={type}></BubbleCanvas>
        </div>
}

export default ScriptPlayer;