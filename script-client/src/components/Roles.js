

const NodeRoles = (props) => {
    return <div className="connections ingoing">
        <div className="row flex Instruction-container"><div className="flex flexing">
            {props.connections.map((v, i) => {
                return <span className="flexing connection-container" key={i}><span onMouseDown={(e) => { props.connectStart(e, v.role_id, "in") }} className={`connection in_${props.id}_${v.role_id}`}>{v.role_id}</span></span>
            })}
        </div><button onClick={props.openRoleOverlay}>add role</button></div>
    </div>
}

export default NodeRoles