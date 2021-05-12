import React, { useCallback, memo } from 'react';
import { useEffect, useRef, useState } from 'react';
import Instruction from "./Instruction"
import BlockRoles from "./BlockRoles"
import {
    atom,
    useRecoilState
} from 'recoil';

const _blockManager = atom({ key: 'blockManager', default: '' });

function Block(props) {
    const [blockManager] = useRecoilState(_blockManager);
    const r_container = useRef();
    const [errors, setErrors] = useState();
    // const r_

    /*     useEffect(() => {
            setErrors(performance.now());
        }, [props.errors]) */



    const getConnectionError = useCallback((direction, errors) => {
        return errors && direction in errors ?
            errors[direction] : false
    }, [])

    const startPosition = useCallback((e) => {
        blockManager.startPosition(e, props.block, props.zoom);
    }, []);

    const confirmDelete = useCallback((e) => {
        blockManager.confirmDelete(e, props.block);
    }, [])

    useEffect(() => {
        // console.log(props.position);
        if (!r_container) return;
        r_container.current.style.transform = `translateX(${props.position.x}px) translateY(${props.position.y}px)`
    }, [props.position])

    useEffect(() => {
        console.log('block update: ', props.roles);
    }, [props.roles])

    return (
        <div
            id={`block_${props.id}`}
            className={`block ${props.connecting ? 'connecting' : ''}`}
            onPointerDown={startPosition}
            onContextMenu={confirmDelete}
            ref={r_container}
        >
            <div className="">
                <BlockRoles
                    block_id={props.id}
                    errors={getConnectionError('start', props.errors)}
                    block={props.block}
                    connections={props.block.connections}
                    direction="in"
                    roles={props.roles}
                ></BlockRoles>
                <div className="instructions">
                    {
                        props.block.instructions.length > 0 ? props.block.instructions.map((id, i) => {
                            if (!(id in props.instructions)) return;
                            let v = props.instructions[id];
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
                                connections={props.block.connections}
                            />
                            );
                        }) : null
                    }
                </div>
                <BlockRoles
                    block_id={props.id}
                    errors={getConnectionError('end', props.errors)}
                    block={props.block}
                    connections={props.block.connections}
                    direction="out"
                    roles={props.roles}
                ></BlockRoles>
            </div>
        </div>
    )
}


function blockPropsAreEqual(prev, next) {
    return prev.position === next.position &&
        prev.connections === next.connections &&
        prev.instructions === next.instructions &&
        prev.errors === next.errors &&
        prev.roles === next.roles;
}


export default memo(Block, blockPropsAreEqual);

