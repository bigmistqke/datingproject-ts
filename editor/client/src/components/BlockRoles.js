
import React, { useRef, useEffect, useState } from 'react';

const BlockRoles = (props) => {
    const openRoleOverlay = (e) => {

        props.blockManager.openRoleOverlay(e, props.block);
    }

    return <div className="connections">
        <div className="row flex Instruction-container"><div className="flex flexing">
            {props.block ? props.block.connections.map((v, i) => {
                return <span className="flexing connection-container" key={i}>
                    <span onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.blockManager.startConnection(props.block, v.role_id, props.direction);
                    }} className={`connection ${props.direction}_${props.block_id}_${v.role_id}`}>{v.role_id}</span></span>
            }) : null}
        </div>{(!props.allRoles || props.block.connections.length != props.allRoles.length) ? <button onClick={openRoleOverlay}>add role</button> : <span></span>}</div>
    </div>
}

export default BlockRoles