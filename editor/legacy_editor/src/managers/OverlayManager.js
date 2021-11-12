import React, { useState, useEffect } from 'react';
import {
    atom,
    useRecoilState
} from 'recoil';
let position = {};
window.addEventListener('mousemove', e => {
    position = { x: e.clientX, y: e.clientY };
})


const OverlayManager = function (setOverlay) {
    this.open = async function ({ type, data }) {
        return new Promise((resolve) => {
            const callback = () => {
                setOverlay(false);
                resolve();
            }
            setOverlay({ type, data, callback })
        })
    }
    this.get = (type, props) => overlays(type, props);
    const overlays = {

        role: (props) => {
            ////console.log('overlay roles:', props.data);
            return (
                <div style={{ left: `${position.x}px`, top: `${position.y}px` }}
                    className="overlay flex">
                    {
                        props.data.roles.sort((a, b) => a > b)
                            .map((v, i) =>
                                <span className={"flexing connection-container "}
                                    key={i}>
                                    <span onMouseDown={() => { props.resolve(v) }}
                                        className="connection">{v}</span>
                                </span>
                            )
                    }
                </div>
            )
        },
        confirm: (props) => {
            ////console.log(props);
            return (
                <div style={{ left: `${position.x}px`, top: `${position.y}px` }}
                    className="overlay text_center">
                    <header>{props.data.text}</header>
                    <button onMouseDown={() => { props.resolve(true) }}>confirm</button>
                </div>
            )
        },
        options: (props) => {
            ////console.log(props);
            return (
                <div style={{ left: `${position.x}px`, top: `${position.y}px` }}
                    className="overlay text_center">
                    <header>{props.data.text}</header>
                    {
                        props.data.options.map(option =>
                            <button key={option} onMouseDown={() => { props.resolve(option) }}>{option}</button>
                        )
                    }
                </div>
            )
        }
    }

}




export default OverlayManager