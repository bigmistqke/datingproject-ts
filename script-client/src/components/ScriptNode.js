import React, { useRef } from 'react';
import { useEffect } from 'react';
import Instruction from "./Instruction"
import NodeRoles from "./NodeRoles"

let ScriptNode = (props) => {
    let r_coords = useRef();
    let r_coords_start = useRef();

    useEffect(() => {
        console.log('connecting?');
    }, [props.connecting])

    const confirmDelete = (e) => {
        props.nodeManager.confirmDelete(e, props.node);
    }

    return (
        <div
            id={`node_${props.id}`}
            className={`node ${props.connecting ? 'connecting' : ''}`}
            onMouseDown={(e) => { props.nodeManager.positioning.start(e, props.node) }}
            onContextMenu={confirmDelete}
        >
            <div className="">
                <NodeRoles node={props.node} connections={props.node.connections} direction="in" nodeManager={props.nodeManager} allRoles={props.allRoles}></NodeRoles>

                <div className="instructions">
                    {
                        props.node.instructions.map((v, i) => {
                            v.index = i;
                            return (<Instruction
                                key={v.instruction_id}
                                data={v}
                                text={v.text}
                                type={v.type}
                                role_id={v.role_id}
                                instruction_id={v.instruction_id}
                                index={i}
                                node_id={v.node_id}
                                connections={props.node.connections}
                                instructionManager={props.instructionManager}
                            />
                            );
                        })
                    }
                </div>
                <NodeRoles node={props.node} allRoles={props.allRoles} connections={props.node.connections} direction="out" nodeManager={props.nodeManager} ></NodeRoles>

            </div>

        </div >
    )
}
export default ScriptNode;