import React, { useCallback, memo } from 'react';
import { useEffect, useRef, useState } from 'react';
import Instruction from "./Instruction"
import BlockRoles from "./BlockRoles"

function Block(props) {
    const r_container = useRef();

    const [instructions, setInstructions] = useState();
    const [roles, setRoles] = useState();

    const getConnectionError = useCallback((direction, errors) => {
        return errors && direction in errors ?
            errors[direction] : false
    }, [])

    const startPosition = useCallback(async (e) => {
        if (e.button !== 0) return;
        e.persist();
        if (!props.ctrlPressed && !props.block.selected)
            props.blockManager.deselectAllBlocks();

        props.blockManager.selectBlock({ block: props.block });
        await props.blockManager.processPosition(e, props.block, props.zoom);
        if (props.blockManager.getSelectedBlocks().length !== 1) return;
        if (!props.ctrlPressed)
            props.blockManager.deselectAllBlocks();


    }, [props.blockManager, props.shiftPressed, props.ctrlPressed]);

    const contextMenu = useCallback((e) => {
        props.blockManager.selectBlock({ block: props.block });
        props.blockManager.confirmDelete(e, props.block);
    }, [])

    useEffect(() => {
        // //console.log(props.position);
        if (!r_container) return;
        r_container.current.style.transform = `translateX(${props.position.x}px) translateY(${props.position.y}px)`
    }, [props.position])

    useEffect(() => {
        setTimeout(() => {
            let boundingBox = {
                top: props.block.position.y,
                left: props.block.position.x - 400,
                width: r_container.current.offsetWidth,
                height: r_container.current.offsetHeight
            }
            props.blockManager.setBoundingBox({ block_id: props.id, boundingBox })
        }, 125);
    }, [r_container, props.position, props.zoom]);

    const addRow = ({ instruction, instruction_id }) => {
        //console.log(instructions);
        /* let _instructions = { ...instructions };
        _instructions[instruction_id] = instruction;
        setInstructions(_instructions); */
    }

    useEffect(() => {
        setInstructions(props.instructions);
    }, [props.instructions])

    useEffect(() => {
        setRoles(props.roles);
    }, [props.roles])

    useEffect(() => {
        //console.log(props.connections);
        // setRoles(props.roles);
    }, [props.connections])

    return (
        <div
            id={`block_${props.id}`}
            className={`block ${props.connecting ? 'connecting' : ''} ${!!props.selected ? 'selected' : ''}`}
            onPointerDown={startPosition}
            onContextMenu={contextMenu}
            ref={r_container}
        >
            <div className="" style={{ pointerEvents: props.connecting ? 'none' : 'auto' }}>
                <BlockRoles
                    block_id={props.id}
                    errors={getConnectionError('start', props.errors)}
                    block={props.block}
                    connections={props.connections}
                    direction="in"
                    roles={roles}
                    blockManager={props.blockManager}
                ></BlockRoles>
                <div className="instructions">
                    {
                        props.block.instructions.length > 0 && instructions ? props.block.instructions.map((id, i) => {
                            if (!(id in instructions)) return;
                            let v = instructions[id];
                            v.index = i;
                            return (<Instruction
                                index={i}
                                key={id}
                                id={id}
                                timespan={v.timespan}
                                text={v.text}
                                type={v.type}
                                role_id={v.role_id}
                                block_id={props.id}
                                sound={v.sound}
                                connections={props.connections}
                                blockManager={props.blockManager}
                                instructionManager={props.instructionManager}
                                videoUploader={props.videoUploader}
                                addRow={addRow}
                            />
                            );
                        }) : null
                    }
                </div>
                <BlockRoles
                    block_id={props.id}
                    errors={getConnectionError('end', props.errors)}
                    block={props.block}
                    connections={props.connections}
                    direction="out"
                    roles={roles}
                    blockManager={props.blockManager}

                ></BlockRoles>
            </div>
        </div>
    )
}


function blockPropsAreEqual(prev, next) {
    return prev.position === next.position &&
        prev.connections === next.connections &&
        prev.instructions === next.instructions &&
        prev.instructions.length === next.instructions.length &&

        prev.errors === next.errors &&
        prev.shiftPressed === next.shiftPressed &&
        prev.ctrlPressed === next.ctrlPressed &&
        prev.selected === next.selected &&
        prev.zoom === next.zoom &&
        prev.roles === next.roles &&
        prev.connecting === next.connecting &&
        prev.render === next.render;
}


export default memo(Block, blockPropsAreEqual);
// export default Block

