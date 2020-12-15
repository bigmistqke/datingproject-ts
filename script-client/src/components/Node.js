import React, { useState, useEffect, useRef } from 'react';
import Instruction from "./Instruction"
import RoleOverlay from "./RoleOverlay"

let ScriptNode = ({ roles, connections, instructions, change, remove, add, openRoleOverlay }) => {


    return (
        <div className="node">
            <div className="connections ingoing">
                <div className="row flex Instruction-container"><div className="flex flexing">
                    {connections.map((v, i) => {
                        return <span className="flexing connection-container" key={i}><span className="connection">{v.role_id}</span></span>
                    })}
                </div><button onClick={openRoleOverlay}>add role</button></div>
            </div>

            <div className="instructions">
                {
                    instructions.map((v, i) => {
                        v.index = i;
                        return (<Instruction
                            key={v.instruction_id}
                            id={v.instruction_id}
                            props={v}
                            index={i}
                            change={(data) => { change(v.node_id, v.instruction_id, data) }}
                            remove={() => { remove(v.node_id, v.instruction_id) }}
                            add={() => { add(v.node_id, v.instruction_id) }} />
                        );
                    })
                }
            </div>
            <div className="connections outgoing">
                <div className="row flex Instruction-container"><div className="flex flexing">
                    {connections.map((v, i) => {
                        return <span className="flexing connection-container" key={i}><span className="connection">{v.role_id}</span></span>
                    })}
                </div > <button onClick={openRoleOverlay}>add role</button></div >
            </div >
        </div >
    )
}
export default ScriptNode;