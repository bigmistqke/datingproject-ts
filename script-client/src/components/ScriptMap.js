import React, { useState, useEffect, useRef, forwardRef } from 'react';
import ScriptNode from './ScriptNode';
import Connectors from './Connectors';

const ScriptMap = (props) => {

    let [connecting, setConnecting] = useState(false);
    let [origin, setOrigin] = useState({ x: 0, y: 0 });
    let r_map = useRef();


    const createNode = (e) => {
        e.preventDefault();
        let position = { x: origin.x * - 1 + e.clientX, y: origin.y * -1 + e.clientY };
        props.nodeManager.add(position);
    }

    const navDown = (e) => {
        if (!e.target.classList.contains("map")) return;
        console.log("that");

        const navMove = (e) => {
            let origin_delta = { x: (startCoords.x - e.clientX) * -1, y: (startCoords.y - e.clientY) * -1 };
            let newCoords = { x: origin.x + origin_delta.x, y: origin.y + origin_delta.y };
            r_map.current.style.transform = `translateX(${newCoords.x}px) translateY(${newCoords.y}px)`;
            setOrigin(newCoords);
        }

        const navUp = (e) => {
            document.releaseCapture();
            e.target.removeEventListener("mousemove", navMove);
            e.target.removeEventListener("mouseup", navUp);
        }
        e.target.addEventListener("mousemove", navMove);
        e.target.addEventListener("mouseup", navUp);
        e.target.setCapture();
        let startCoords = { x: e.clientX, y: e.clientY };
        e.preventDefault();
    }

    useEffect(() => {
        console.log(props.overlay);
    }, [props.overlay]);

    return <div className="map-container" onMouseDown={navDown} onContextMenu={createNode}>
        <div className={`map${connecting ? ' connecting' : ''}`} >
            <div className="Map" ref={r_map}>
                <Connectors nodes={props.nodes} origin={origin}></Connectors>
                {
                    props.nodes.map((node, i) => {
                        return <div
                            className="absolute" key={i} style={{ transform: `translateX(${node.position.x}px) translateY(${node.position.y}px)` }}>
                            <ScriptNode
                                key={node.node_id}
                                id={node.node_id}
                                instructionManager={props.instructionManager}
                                nodeManager={props.nodeManager}
                                node={node}
                                connecting={props.connecting}
                                allRoles={props.allRoles}
                            >
                            </ScriptNode>
                        </div>
                    })
                }
            </div>
        </div>
    </div>
}

export default ScriptMap