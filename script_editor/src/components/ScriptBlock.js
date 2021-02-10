import React, { useRef } from 'react';
import { useEffect } from 'react';
import Instruction from "./Instruction"
import BlockRoles from "./BlockRoles"

let ScriptBlock = (props) => {
    let r_coords = useRef();
    let r_coords_start = useRef();

    useEffect(() => {
        console.log('connecting?');
    }, [props.connecting])

    const confirmDelete = (e) => {
        props.blockManager.confirmDelete(e, props.block);
    }

    return (
        <div
            id={`block_${props.id}`}
            className={`block ${props.connecting ? 'connecting' : ''}`}
            onPointerDown={(e) => { props.blockManager.positioning.start(e, props.block) }}
            onContextMenu={confirmDelete}
        >
            <div className="">
                <BlockRoles block_id={props.id} block={props.block} connections={props.block.connections} direction="in" blockManager={props.blockManager} allRoles={props.allRoles}></BlockRoles>

                <div className="instructions">
                    {
                        props.block.instructions.length > 0 ? props.block.instructions.map((_v, i) => {
                            if (!(_v in props.instructions)) return;
                            let v = props.instructions[_v];
                            v.index = i;

                            return (<Instruction
                                key={_v}
                                id={_v}
                                data={v}
                                text={v.text}
                                type={v.type}
                                role_id={v.role_id}
                                instruction_id={_v}
                                index={i}
                                block_id={props.id}
                                connections={props.block.connections}
                                instructionManager={props.instructionManager}
                            />
                            );
                        }) : null
                    }
                </div>
                <BlockRoles block_id={props.id} block={props.block} connections={props.block.connections} direction="out" blockManager={props.blockManager} allRoles={props.allRoles}></BlockRoles>

            </div>

        </div >
    )
}
export default ScriptBlock;