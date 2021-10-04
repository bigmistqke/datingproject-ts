
import React, { memo, useEffect } from 'react';

import {
    atom,
    useRecoilState
} from 'recoil';

/* const _props.blockManager = atom({
    key: 'props.blockManager', // unique ID (with respect to other atoms/selectors)
    default: '', // default value (aka initial value)
}); */

const BlockRoles = (props) => {
    // let [props.blockManager] = useRecoilState(_props.blockManager);

    const openRoleOverlay = (e) => {
        let remainingRoles = props.blockManager.openRoleOverlay(e, props.block);
    }

    const startConnection = (e, role_id) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.buttons !== 1) return;
        ////console.log(props.block, role_id, props.direction);
        props.blockManager.processConnection({ block: props.block, role_id, direction: props.direction });

    }

    const removeRole = (e, role_id) => {
        e.preventDefault();
        e.stopPropagation();
        // props.blockManager.removeRole(e, role_id, props.block);
    }

    const checkErrors = (role_id) => {
        if (!!props.errors && props.errors.filter(e => e === role_id).length != 0) {
            return 'error'
        }
        return ''
    }



    return <div className="connections">
        <div className="row flex Instruction-container"><div className="flex flexing">
            {
                props.block ? props.connections.sort((a, b) => parseInt(a.role_id) - parseInt(b.role_id)).map((v, i) => {
                    return (
                        <span className="flexing connection-container" key={i}>
                            <span
                                onPointerDown={(e) => {
                                    ////console.log('this happens');
                                    e.preventDefault();
                                    e.stopPropagation();
                                    startConnection(e, v.role_id);
                                }}
                                onContextMenu={(e) => { removeRole(e, v.role_id) }}
                                className={`connection ${props.direction}_${props.block_id}_${v.role_id} ${checkErrors(v.role_id)}`}
                            >
                                {v.role_id}
                            </span>
                        </span>
                    )
                }) : null
            }
        </div>
            {
                (!props.roles || props.block.connections.length != props.roles.length) ?
                    <button onClick={openRoleOverlay}>add role</button> :
                    <span></span>
            }
        </div>
    </div>
}

function rolePropsAreEqual(prev, next) {
    return prev.connections === next.connections &&
        prev.errors === next.errors &&
        prev.roles === next.roles;
}

export default BlockRoles