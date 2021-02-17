import React, { useState, useEffect } from 'react';

let position = {};
window.addEventListener('mousemove', e => {
    position = { x: e.clientX, y: e.clientY };
})

const Overlays = {
    role: (props) => {
        return (
            <div style={{ left: `${position.x}px`, top: `${position.y}px` }}
                className="overlay flex">
                {
                    props.data.roles.sort((a, b) => a.role_id > b.role_id)
                        .map((v, i) =>
                            <span className={"flexing connection-container "}
                                key={i}>
                                <span onMouseDown={() => { props.resolve(v.role_id) }}
                                    className="connection">{v.role_id}</span>
                            </span>
                        )
                }
            </div>
        )
    },
    confirm: (props) => {
        console.log(props);
        return (
            <div style={{ left: `${position.x}px`, top: `${position.y}px` }}
                className="overlay text_center">
                <header>{props.data.text}</header>
                <button onMouseDown={() => { props.resolve(true) }}>confirm</button>
            </div>
        )
    },
    options: (props) => {
        console.log(props);
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

export default Overlays