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
        props.blocks.forEach((block) => {
            block.connections.forEach((connection) => {
                // console.log('connection', connection);

                let next_block_id = connection.next_block_id;
                let prev_block_id = connection.prev_block_id;
                if (!next_block_id && !prev_block_id) return;
                if (typeof prev_block_id === 'string') {
                    let className = `in_${block.block_id}_${connection.role_id}`;
                    let start_pos = getCenterDOM(className);
                    // console.log([start_pos], className);

                    className = `out_${prev_block_id}_${connection.role_id}`;
                    let out_pos = getCenterDOM(className);
                    t_connectors.push([start_pos, out_pos]);
                    // console.log([start_pos, out_pos], className);
                }
                if (prev_block_id && typeof prev_block_id === 'object') {
                    let className = `in_${block.block_id}_${connection.role_id}`;
                    let start_pos = getCenterDOM(className);
                    t_connectors.push([start_pos, prev_block_id]);
                }
                if (next_block_id && typeof next_block_id === 'object') {
                    let className = `out_${block.block_id}_${connection.role_id}`;
                    let start_pos = getCenterDOM(className);
                    t_connectors.push([start_pos, next_block_id]);
                }
            })
        })
        setConnectors(t_connectors);
    }, [props.blocks])

    return (<div>
        {
            connectors ? connectors.map((v, i) => {
                return <Connector key={i} pos={v} origin={props.origin}></Connector>
            }) : null
        }
    </div>)
}

export default Connectors;