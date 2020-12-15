import React, { useState, useEffect, useRef, forwardRef } from 'react';
import uniqid from "uniqid";


const NavigationManager = forwardRef((props, ref) => {

    let r_coords = useRef({ x: 0, y: 0 });
    let r_coords_start = useRef();
    let r_shiftPressed = useRef(true);
    let r_isNavigating = useRef(false);
    let r_isDragging = useRef(false);
    let r_dragNode = useRef();

    let ctrl_ref = useRef(false);
    let r_nodes = useRef();
    let getDefaultNode = () => { let node_id = uniqid(); return { node_id: node_id, instructions: [getDefaultRow(node_id)], connections: [] } };
    let [nodes, setNodes] = useState([]);

    let map_DOM = useRef();



    const keyUp = (e) => {
        ctrl_ref.current = false;
    }
    const keyDown = (e) => {
        if (e.ctrlKey || e.metaKey) {
            ctrl_ref.current = true;
        }
        if (e.shiftKey) {
            r_shiftPressed.current = true;
        }
    }

    let getDefaultRow = (node_id) => { return { instruction_id: uniqid(), node_id: node_id, script_id: parseInt(props.script_id), role: "a", type: "say", text: "" } }


    const createNode = (e) => {
        e.preventDefault();
        let tempNodes = [...r_nodes.current];
        let newNode = getDefaultNode();
        let coords_temp = r_coords.current;
        newNode.position = { x: coords_temp.x * - 1 + e.clientX, y: coords_temp.y * -1 + e.clientY };
        tempNodes.push(newNode);
        setNodes(tempNodes);
        r_nodes.current = tempNodes;
    }

    const dragDown = (e, node) => {
        if (!e.target.classList.contains("node")) return;
        e.target.addEventListener("mousemove", dragMove);
        e.target.addEventListener("mouseup", dragUp);
        e.target.setCapture();
        r_coords_start.current = { x: e.clientX, y: e.clientY };
        r_isDragging.current = true;
        r_dragNode.current = node;
        e.preventDefault();
    }

    const dragMove = (e) => {
        let node = r_dragNode.current;
        console.log(node);
        let coords_start = r_coords_start.current;
        let coords_delta = { x: (coords_start.x - e.clientX) * -1, y: (coords_start.y - e.clientY) * -1 };
        let tempNodes = [...r_nodes.current];
        tempNodes.find(v => v.node_id === node.node_id).position = { x: node.position.x + coords_delta.x, y: node.position.y + coords_delta.y };
        setNodes(tempNodes);
        r_coords_start.current = { x: e.clientX, y: e.clientY };
    }
    const dragUp = (e) => {
        e.target.removeEventListener("mousemove", dragMove);
        e.target.removeEventListener("mouseup", dragUp);
        document.releaseCapture();
    }

    const navDown = (e) => {
        console.log("OK");
        if (!e.target.classList.contains("map-container")) return;
        // setShowOverlay(false);
        e.target.addEventListener("mousemove", navMove);
        e.target.addEventListener("mouseup", navUp);
        e.target.setCapture();
        r_coords_start.current = { x: e.clientX, y: e.clientY };
        if (ctrl_ref.current || e.target.classList.contains("map-container")) {
            r_isNavigating.current = true;
            e.preventDefault();
        }
    }

    const navMove = (e) => {
        if (r_isNavigating.current) {
            let coords_temp = r_coords.current;
            let coords_start = r_coords_start.current;
            let coords_delta = { x: (coords_start.x - e.clientX) * -1, y: (coords_start.y - e.clientY) * -1 };
            map_DOM.current.style.transform = `translateX(${coords_delta.x + coords_temp.x}px) translateY(${coords_delta.y + coords_temp.y}px)`;
        }
    }

    const navUp = (e) => {
        if (r_isNavigating.current) {
            document.releaseCapture();

            let coords_temp = r_coords.current;
            let coords_start = r_coords_start.current;
            let coords_delta = { x: (coords_start.x - e.clientX) * -1, y: (coords_start.y - e.clientY) * -1 };

            r_coords.current = { x: coords_delta.x + coords_temp.x, y: coords_delta.y + coords_temp.y };
            r_isNavigating.current = false;
            e.target.removeEventListener("mousemove", navMove);
        }
    }

    return <div class="map-container" onMouseDown={navDown} onContextMenu={createNode} ref={map_DOM}>
        {
            props.nodes.map((node, i) => {
                return <div className="absolute" onMouseDown={(e) => { r_navigationManager.current.dragDown(e, node) }} key={i} style={{ transform: `translateX(${node.position.x}px) translateY(${node.position.y}px)` }}>
                    <ScriptNode
                        isConnecting={r_connectorManager.isConnecting}
                        key={i}
                        id={node.node_id}
                        connections={node.connections}
                        instructions={node.instructions}
                        index={i}
                        change={updateInstruction}
                        remove={removeInstruction}
                        add={addInstruction}
                        roles={node.roles}
                        openRoleOverlay={(e) => { r_connectorManager.openRoleOverlay(e, node) }}
                        connectStart={(e, role_id, inOutStart) => { r_connectorManager.connectStart(e, role_id, node, inOutStart) }}
                        checkConnection={(e, role_id) => { r_connectorManager.checkConnection(e, role_id, node) }}
                    >
                    </ScriptNode>
                </div>
            })
        }
        <div ref={map_DOM} class="map"></div></div>
})

export default NavigationManager;