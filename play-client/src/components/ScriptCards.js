import React, { useEffect, useState, useRef } from 'react';
import { useParams, useHistory } from "react-router-dom";
import Swipe from "./Swipe";
import socketIOClient from "socket.io-client";
import getData from '../helpers/getData';
import ScriptCard from './ScriptCard';

let current = { script: [] };
const ENDPOINT = "https://socket.datingproject.net";
// const ENDPOINT = "localhost:4001";
let socket = null;

function ScriptCards() {
    const history = useHistory();

    let { script_id, pair_id } = useParams();
    let [script, setThisScript] = useState();
    let [hide, setHide] = useState(false);
    let [waiting, setWaiting] = useState();
    let [waitIndex, setWaitIndex] = useState();
    let [script_index, setScriptIndex] = useState(0);

    let script_ref = useRef();
    let scriptIndex_ref = useRef();
    let nextCardIndex_ref = useRef();
    let waitIndex_ref = useRef(0);

    var socket = useRef();

    async function getScript() {
        return getData(`https://fetch.datingproject.net/script/${script_id}`)
            .then(res => res.json())
            .then(script => {
                script.sort((a, b) => { return a.instruction_order - b.instruction_order })
                return script;
            });
    }

    const initSocket = () => {


        if (!pair_id) {
            ////console.log("PAIR ID!!!!!");
            socket.current.emit("findPair", script_id);
        } else {
            socket.current.emit("pairClient", [script_id, pair_id]);
        }

        socket.current.on("initScript", ({ role_id, script_id, script_index }) => {
            ////console.log(`script_index is ${script_index}`);
            setScriptIndex(script_index);
            setWaiting(false);

            scriptIndex_ref.current = script_index;
            socket.current.script_id = script_id;
            socket.current.pair_id = pair_id;
            socket.current.role_id = role_id;
            ////console.log(role_id);
            if (typeof role_id === 'string') {
                current.role_id = role_id;
                getScript().then((response) => {
                    for(let i = 0; i < script_index; i++){
                        response[i].swiped = true;
                    }
                    ////console.log(response);
                    current.script = JSON.parse(JSON.stringify(response));
                    script_ref = response;
                    setThisScript(response);
                });
            } else {
                ////console.log("THIS SHOUT H APPEN?");
            }
        })

        socket.current.on("log", allClients => {
            ////console.log(allClients);
        });
        socket.current.on("waitForOther", () => {
            ////console.log("OK?");
            setWaiting(true);
            setWaitIndex(0);
            // setThisScript([{text:`invite your date to join at \n ${window.location.href}`, type: "do"}]);

            // setInstruction(`invite your date to join at \n ${window.location.href}`);
            // setType("wait");
        })
        socket.current.on("nextCard", (index) => {
            ////console.log("PLAY NEXT CARD!!!!!");
            if(index < current.script.length){
                current.script[(index - 1)].swiped = true;
            }

            ////console.log(script === current.script);
            scriptIndex_ref.current = index;
            setThisScript(JSON.parse(JSON.stringify(current.script)));
            setScriptIndex(index);
            // setHide(true);
        })
        socket.current.on("isPaired", data => {
            ////console.log("role_id is " + data.role_id);
            let new_pair = pair_id !== data.pair_id ? true : false;
            pair_id = data.pair_id;
            // setRole(data.role_id);
            ////console.log(data);
            if (new_pair) {
                history.push(`/${script_id}/${pair_id}`, { update: true });
                ////console.log(`${script_id}/${pair_id}`);
            }
        });
        socket.current.on("roomFull", () => {
            ////console.log("ROOM IS FULL");
            // const findOtherRoom = confirm("this play is full, find another play?");
            socket.current.emit("findPair", script_id);
        })
        socket.current.on("otherGone", data => {
            ////console.log("other dude left " + data);
        });
        
    }

    let setNextCard = (zIndex) => {
        let index = current.script.length - zIndex;
        if(index < current.script.length){
            current.script[index].swiped = true;
        }
        // setThisScript(current.script);
        socket.current.emit("nextCard", index);
        scriptIndex_ref.current = index;
        setScriptIndex(index);
    }
    let setNextWaitCard = (zIndex) => {
        let index = waitingSequence.length - zIndex;
        if(index < waitingSequence.length){
            waitingSequence[index].swiped = true;
        }
        waitIndex_ref.current = index;
        setWaitIndex(index);
    }

    useEffect(() => {
        setTimeout(()=>{
            socket.current = socketIOClient(ENDPOINT, {
                // WARNING: in that case, there is no fallback to long-polling
                transports: [ 'websocket', 'polling' ] // or [ 'websocket', 'polling' ], which is the same thing
            });
            setTimeout(()=>{
                initSocket();
            }, 1000);

        }, 1000);
       
    }, []);

    useEffect(()=>{
        ////console.log("ok?");
        nextCardIndex_ref = getnextCardIndex_ref();
        //console.log(visibleCards());
    });

    const getnextCardIndex_ref = () => {
        const findNextCard = (from) => {
            let nextCard = current.script.slice(from, current.script.length).find(card=> card.role === socket.current.role_id);
            ////console.log(nextCard);
            return {card: nextCard, index: current.script.indexOf(nextCard)};
        }
        let nextCard = findNextCard(script_index);
        if(nextCard.card){
            let cardAfterNext = findNextCard(nextCard.index + 1);
            if(cardAfterNext.card){
                return cardAfterNext.index + (nextCard.index + 1);
            }else{
                return nextCard.index;
            }
        }else{
            return false;
        }
        //console.log(current.script.slice(script_index, current.script.length).find(card=> card.role === socket.current.role_id));
  
    }

    let endCard = () => {
        if(!script || script.length == 1){return null};
        let nextIndex = getnextCardIndex_ref();
        if(nextIndex < (scriptIndex_ref.current + 3) || !nextIndex){
            let flip = false;
            //console.log("SCRIPT LENGTH + scriptIndex_ref", scriptIndex_ref.current, script.length);
            if(scriptIndex_ref.current == script.length) {flip = true};
            //console.log("FLIP IS  "+ flip);
            return <Swipe nextCard={() => { }} zIndex={0} swiped={0} flip={flip} canSwipe={true}><ScriptCard key={0}  data={{type: "empty", text: "the end"}} ></ScriptCard></Swipe>;
        }else{
            return null;
        }
    }
    //console.log();

    let visibleCards = () => {
        let nextIndex = getnextCardIndex_ref();
        if(!script || !nextIndex) return [];
        let cards = [];
        script.slice(0).map((data, i) => {
            //console.log(i, nextIndex);
            if(data.swiped) return null;
            if(i > nextIndex) return null;
            if (current.role_id === data.role) {
                if(i == scriptIndex_ref.current - 1){
                    cards.push(<Swipe nextCard={() => { setNextCard(i) }} zIndex={(i+1)} swiped={0} canSwipe={true} flip={true}><ScriptCard key={i}  data={data} ></ScriptCard></Swipe>);
                }else{
                    cards.push(<Swipe nextCard={() => { setNextCard(i) }} zIndex={(i+1)} swiped={0} canSwipe={false} flip={false}><ScriptCard key={i}  data={data} ></ScriptCard></Swipe>);
                }
            } else {
                // return null;
            }
        })
        //console.log(cards, scriptIndex_ref.current);
        return cards;
    }

    const waitingSequence = [
        {type: "empty", text: "swipe to enter"}, 
        {type: "empty", text: "welcome to play.datingproject.net"},
        {type: "empty", text: "a roleplay "},
        {type: "empty", text: "click here to invite"},
        {type: "empty", text: "waiting for guest to join"},
    ]

    return (
        <div className="scriptCards">
            {
                waiting ? waitingSequence.slice(0).reverse().map((data, i)=>{
                    if(i == (waitingSequence.length - waitIndex_ref.current) - 1){
                        return <Swipe swipeAction={() => { setNextWaitCard(i) }} zIndex={(i+1)} swiped={0} canSwipe={true} flip={true} ><ScriptCard key={i} data={data} ></ScriptCard></Swipe>
                    }else{
                        return <Swipe swipeAction={() => { setNextWaitCard(i) }} zIndex={(i+1)} swiped={0} canSwipe={false} flip={false}><ScriptCard key={i}  data={data} ></ScriptCard></Swipe>
                    }
                }) : null
            }
            {script ? script.slice(0).reverse().map(function (data, i) {
                if(data.swiped) return null;
                if((script.length - i) - 1 > getnextCardIndex_ref()) return null;
                //console.log("RENDER", script.length, scriptIndex_ref.current);
                if (current.role_id === data.role) {
                    if(i == (script.length - scriptIndex_ref.current) - 1){
                        return <Swipe swipeAction={() => { setNextCard(i) }} zIndex={(i+1)} swiped={0} canSwipe={true} flip={true} ><ScriptCard key={i} data={data} ></ScriptCard></Swipe>
                    }else{
                        return <Swipe swipeAction={() => { setNextCard(i) }} zIndex={(i+1)} swiped={0} canSwipe={false} flip={false}><ScriptCard key={i}  data={data} ></ScriptCard></Swipe>
                    }
                } else {
                    return null;
                }
            }) : null}
            {endCard()}
            {/* {script ? script.length < (scriptIndex_ref.current + 2) ?  : null : null}} */}
        </div>)

}

export default ScriptCards