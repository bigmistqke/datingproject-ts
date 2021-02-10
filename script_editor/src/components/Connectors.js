import React, { useState, useEffect } from 'react';
import Connector from './Connector';


const Connectors = (props) => {
    let [connectors, setConnectors] = useState([]);

    let getCenterDOM = (className) => {
        let DOM = document.querySelector(`.${className}`);
        if (!DOM) return;
        let bound = DOM.getBoundingClientRect();
        let height_padding = className.indexOf('in') === -1 ? bound.height : 1;
        return { x: bound.x + bound.width / 2, y: bound.y + height_padding };
    }

    useEffect(() => {
        let t_connectors = [];
        props.nodes.forEach((node) => {
            node.connections.forEach((connection) => {
                let next_node_id = connection.next_node_id;
                let prev_node_id = connection.prev_node_id;
                if (!next_node_id && !prev_node_id) return;
                if (typeof prev_node_id === 'string') {
                    let className = `in_${node.node_id}_${connection.role_id}`;
                    let start_pos = getCenterDOM(className);
                    className = `out_${prev_node_id}_${connection.role_id}`;
                    let out_pos = getCenterDOM(className);
                    t_connectors.push([start_pos, out_pos]);
                }
                if (prev_node_id && typeof prev_node_id === 'object') {
                    let className = `in_${node.node_id}_${connection.role_id}`;
                    let start_pos = getCenterDOM(className);
                    t_connectors.push([start_pos, prev_node_id]);
                }
                if (next_node_id && typeof next_node_id === 'object') {
                    let className = `out_${node.node_id}_${connection.role_id}`;
                    let start_pos = getCenterDOM(className);
                    t_connectors.push([start_pos, next_node_id]);
                }
            })
        })
        setConnectors(t_connectors);
    }, [props.nodes])

    return (<div>
        {
            connectors ? connectors.map((v, i) => {
                return <Connector key={i} pos={v} origin={props.origin}></Connector>
            }) : null
        }
    </div>)
}

export default Connectors;