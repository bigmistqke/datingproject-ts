import React, { useState, useEffect, useRef, forwardRef } from 'react';
import uniqid from "uniqid";
import RoleOverlay from "./RoleOverlay";
import Connector from './Connector';


const ConnectionVisualizer = forwardRef((props, ref) => {
    let [connectors, setConnectors] = useState();
    let r_coords = useRef({ x: 0, y: 0 });
    let r_coords_start = useRef({ x: 0, y: 0 });
    let r_connection_id = useRef();
    let r_isConnecting = useRef(false);
    let r_conNode = useRef();
    let [isConnecting, setConnecting] = useState(false);
    let r_connectionLines = useRef([]);

    let [posOverlay, setPosOverlay] = useState();
    const [overlayRoles, setOverlayRoles] = useState();
    const [overlayNode, setOverlayNode] = useState();
    let [showOverlay, setShowOverlay] = useState(false);

    let connectStart = (e, role_id, node, inOutStart) => {
        console.log("START!", node);
        document.body.addEventListener("mousemove", connectMove);
        document.body.addEventListener("mouseup", connectUp);

        r_coords_start.current = { x: e.clientX, y: e.clientY };
        r_connection_id.current = uniqid();

        let newLine = { connection_id: r_connection_id.current, inOutStart: inOutStart, nodes: [node.node_id], role: role_id, pos: [{ x: e.clientX, y: e.clientY }, { x: e.clientX, y: e.clientY }], type: "dragging" };
        let tempLines = [...r_connectionLines.current];
        tempLines.push(newLine);
        r_connectionLines.current = tempLines;
        setConnectors(tempLines);

        r_conNode.current = node;
        r_isConnecting.current = true;
        setConnecting(true);
    }

    let connectMove = (e) => {
        let tempLines = [...r_connectionLines.current];
        // tempLines.push(newLine);
        let foundLine = tempLines.find(el => el.connection_id === r_connection_id.current)
        if (foundLine) {
            foundLine.pos[1] = { x: e.clientX, y: e.clientY };
            setConnectors(tempLines);
            r_connectionLines.current = tempLines;
        }
    }

    let connectUp = (e) => {
        console.log("UP!");
        document.body.removeEventListener("mousemove", connectMove);
        document.body.removeEventListener("mouseup", connectUp);
        e.target.setCapture();
        r_coords_start.current = { x: e.clientX, y: e.clientY };
        setConnecting(false);
        console.log(e.target);

        if (e.target.classList.contains("App")) {
            let tempLines = [...r_connectionLines.current];
            tempLines = tempLines.filter(el => el.connection_id != r_connection_id.current);
            setConnectors(tempLines);
            r_connectionLines.current = tempLines;
            r_isConnecting.current = false;
        }


    }

    const openRoleOverlay = (e, node) => {
        setShowOverlay(true);
        setPosOverlay({ x: e.clientX, y: e.clientY });
        let remainingRoles = [];

        props.r_roles.current.forEach(r_role => {
            let foundConnection = node.connections.find(connection => connection.role_id == r_role.role_id);
            console.log(foundConnection);
            if (!foundConnection) remainingRoles.push(r_role);
        })
        console.log("remaining", remainingRoles);
        setOverlayRoles(remainingRoles);
        setOverlayNode(node.node_id);
    }

    const addConnection = (role_id, node_id) => {
        console.log("ADDCONN", role_id, node_id);
        let tempNodes = [...props.r_nodes.current];
        tempNodes.find(v => v.node_id === node_id).connections.push({ role_id: role_id, node_id: node_id, script_id: props.script_id, prev_node_id: null, next_node_id: null });
        props.updateNodes(tempNodes);
        setShowOverlay(false);
    }

    const updateConnector = () => {

    }

    const checkConnection = (e, role_id, node) => {
        let connecting_node = r_conNode.current;
        if (!node || !connecting_node) { return };
        if (connecting_node && r_isConnecting && node && node.node_id != connecting_node.node_id) {
            let tempLines = [...r_connectionLines.current];
            let foundNodes = tempLines.find(el => el.connection_id === r_connection_id.current).nodes;
            if (foundNodes && foundNodes.find(el => el === node.node_id)) {
                let thisTempLine = tempLines.find(el => el.connection_id === r_connection_id.current);
                thisTempLine.nodes.push(node.node_id);
                thisTempLine.type = "connected";

                let theseNodes = thisTempLine.nodes;

                let tempNodes = [...props.r_nodes.current];


                let thisNode = tempNodes.find((v) => { return v.node_id === node.node_id });
                let otherNode = tempNodes.find((v) => { return v.node_id === connecting_node.node_id });

                console.log("connections", thisNode.connections);

                if (thisNode.connections.length < 0) return;
                if (thisTempLine.inOutStart === "out") {
                    thisNode.connections.find(v => { console.log("role_id", v.role_id, thisTempLine.role); return v.role_id === thisTempLine.role }).prev_node_id = theseNodes[0];
                    otherNode.connections.find(v => { return v.role_id === thisTempLine.role }).next_node_id = theseNodes[1];
                } else {
                    thisNode.connections.find(v => { console.log("role_id", v.role_id, thisTempLine.role); return v.role_id === thisTempLine.role }).next_node_id = theseNodes[0];
                    otherNode.connections.find(v => { return v.role_id === thisTempLine.role }).prev_node_id = theseNodes[1];
                }



                // connections.find((v) => { return v.role_id === role_id }).next_node_id == theseNodes[0];
                console.log("tempNodes", tempNodes);
                console.log(tempLines);
                setConnectors(tempLines);
            }


        } else {

        }

    }

    return (<div>
        {showOverlay ? <RoleOverlay position={posOverlay} roles={overlayRoles} addConnection={(role_id) => { addConnection(role_id, overlayNode) }}></RoleOverlay> : null}
        {
            connectors ? connectors.map((v, i) => {
                console.log("v", v);
                return <Connector key={i} role={v.role} type={v.type} inOutStart={v.inOutStart} pos1={v.pos[0]} pos2={v.pos[1]} nodes={v.nodes} nav_coords={r_coords.current}></Connector>
            }) : null
        }
        {props.children}
    </div>)
})

export default ConnectionVisualizer;