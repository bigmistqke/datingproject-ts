
import React, { useRef, useEffect, useState } from 'react';

const NodeRoles = (props) => {
    const openRoleOverlay = (e) => {

        props.nodeManager.openRoleOverlay(e, props.node);
    }

    return <div className="connections">
        <div className="row flex Instruction-container"><div className="flex flexing">
            {props.node ? props.node.connections.map((v, i) => {
                return <span className="flexing connection-container" key={i}>
                    <span onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.nodeManager.connecting.start(props.node, v.role_id, props.direction);
                    }} className={`connection ${props.direction}_${v.node_id}_${v.role_id}`}>{v.role_id}</span></span>
            }) : null}
        </div>{(!props.allRoles || props.node.connections.length != props.allRoles.length) ? <button onClick={openRoleOverlay}>add role</button> : <span></span>}</div>
    </div>
}

export default NodeRoles