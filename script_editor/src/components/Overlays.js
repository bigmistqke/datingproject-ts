import React, { useState, useEffect } from 'react';
let RoleOverlay = (props) => {
    return <div style={{ left: `${props.position.x}px`, top: `${props.position.y}px` }} className="overlay flex"> {
        props.data.roles.sort((a, b) => { return a.role_id > b.role_id }).map((v, i) => {
            return <span className={"flexing connection-container "} key={i}><span onMouseDown={() => { props.resolve(v.role_id) }} className="connection">{v.role_id}</span></span>
        })
    }</ div>
}

let ConfirmOverlay = (props) => {
    return <div style={{ left: `${props.position.x}px`, top: `${props.position.y}px` }} className="overlay text_center">
        <header>{props.data.text}</header>
        <button onMouseDown={() => { props.resolve(true) }}>confirm</button>
    </ div>
}

export { RoleOverlay, ConfirmOverlay };