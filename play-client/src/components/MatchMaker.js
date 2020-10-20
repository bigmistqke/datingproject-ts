import React, { useEffect } from 'react';
import getData from '../helpers/getData';
import socketIOClient from "socket.io-client";
import {useParams, useHistory} from "react-router-dom";

let current = {};
const ENDPOINT = "http://127.0.0.1:4001";
let socket = null;
let role_id = null;
let pair_id = null;

const ScriptPlayer = () => {
    let { script_id, pair_id } = useParams();
    const history = useHistory();
    useEffect(() => {
        socket = socketIOClient(ENDPOINT);
        socket.emit("scriptId", script_id);
        socket.on("log", allClients => {
            console.log(allClients);
        });
        socket.on("click", data => {
            console.log(data);
        });
        socket.on("isPaired", data => {
            console.log("role_id is " + data);
            if(!pair_id){
                history.push(`${script_id}/${data.pair_id}`);
            }
            console.log("ROLE ID IS "+ data.role_id);
            role_id = data.role_id;
            pair_id = data.pair_id;
        });
        socket.on("otherGone", data => {
            console.log("other dude left " + data);
            // role_id = data;
        });
        getData(`http://localhost:8080/script/${script_id}`)
            .then(res => res.json())
            .then(res => {
                console.log(res);
                current.scripts = res;
            });
    }, []);


    return <div>script is {script_id} and role is {role_id}</div>
}

export default ScriptPlayer;