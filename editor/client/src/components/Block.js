import React, { useCallback, memo } from 'react';
import { useEffect } from 'react';
import Instruction from "./Instruction"
import BlockRoles from "./BlockRoles"
import {
    atom,
    useRecoilState
} from 'recoil';

const _blockManager = atom({ key: 'blockManager', default: '' });

let Block = (props) => {
    const [blockManager] = useRecoilState(_blockManager);

    useEffect(() => {
    }, [props.connecting])



    const getConnectionError = (direction) => {
        return props.errors && direction in props.errors ?
            props.errors[direction] : false
    }

    const startPosition = useCallback((e) => {
        blockManager.startPosition(e, props.block);
    }, []);

    const confirmDelete = useCallback((e) => {
        blockManager.confirmDelete(e, props.block);
    }, [])

    // const _block = useMeme(()=>())

    return (
        <div
            id={`block_${props.id}`}
            className={`block ${props.connecting ? 'connecting' : ''}`}
            onPointerDown={startPosition}
            onContextMenu={confirmDelete}
        >
            <div className="">
                <BlockRoles
                    block_id={props.id}
                    errors={getConnectionError('start')}

                    block={props.block}
                    connections={props.block.connections}
                    direction="in"
                    allRoles={props.roles}
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
                    errors={getConnectionError('end')}
                    block={props.block}
                    connections={props.block.connections}
                    direction="out"
                    allRoles={props.roles}
                ></BlockRoles>
            </div>
        </div>
    )
}
export default memo(Block);

