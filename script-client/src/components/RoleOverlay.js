import React, { useState, useEffect } from 'react';
let RoleOverlay = (props) => {
    return props.roles && props.roles.length > 0 ? <div style={{ left: `${props.position.x}px`, top: `${props.position.y}px` }} className="overlay flex"> {
        props.roles.sort((a, b) => { return a.role_id > b.role_id }).map((v, i) => {
            return <span className={"flexing connection-container "} key={i}><span onMouseDown={() => { props.resolve({ node: props.node, role_id: v.role_id }) }} className="connection">{v.role_id}</span></span>
        })
    }</ div> : null
}

export default RoleOverlay;