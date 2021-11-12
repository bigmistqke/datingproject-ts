

const BlockRoles = (props) => {

    const openRoleOverlay = async (e) => {
        let role_id = await props.stateManager.UI.openRoleOverlay(e, props.block);
        //overlay.set(false);
        if (!role_id) return;
        props.stateManager.blocks.addRoleToConnections({
            block: props.block,
            role_id
        });
        setTimeout(() => {
            props.visualizeErrors();
        }, 10)
        setTimeout(() => {
            props.stateManager.UI.calculateConnections();
        }, 100)
    }

    const startConnection = (e, role_id) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.buttons !== 1) return;

        props.stateManager.blocks.processConnection({
            block: props.block,
            role_id,
            direction: props.direction
        });

    }

    const removeRole = (e, role_id) => {
        e.preventDefault();
        e.stopPropagation();
        props.stateManager.blocks.removeRole(e, role_id, props.block);
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