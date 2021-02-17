import React, { useRef } from 'react';
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

    const confirmDelete = (e) => {
        blockManager.confirmDelete(e, props.block);
    }

    return (
        <div
            id={`block_${props.id}`}
            className={`block ${props.connecting ? 'connecting' : ''}`}
            onPointerDown={(e) => { blockManager.startPosition(e, props.block) }}
            onContextMenu={confirmDelete}
        >
            <div className="">
                <BlockRoles block_id={props.id} block={props.block} connections={props.block.connections} direction="in" allRoles={props.roles}></BlockRoles>

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
                <BlockRoles block_id={props.id} block={props.block} connections={props.block.connections} direction="out" allRoles={props.roles}></BlockRoles>
            </div>
        </div >
    )
}
export default Block;