import React, { useState, useEffect, memo } from 'react';
import Connection from './Connection';
import {
    atom,
    useRecoilState
} from 'recoil';

const _blockManager = atom({ key: 'blockManager', default: '' });


const Connections = (props) => {
    let [connections, setConnections] = useState([]);
    let [render, setRender] = useState();


    let getCenterDOM = (className) => {
        let DOM = document.querySelector(`.${className}`);
        if (!DOM) return;
        let bound = DOM.getBoundingClientRect();
        let height_padding = className.indexOf('in') === -1 ? bound.height : 1;
        return { x: (bound.x + bound.width / 2), y: (bound.y + height_padding) };
    }



    useEffect(() => {

        // console.log('this should happen? ', props.block.block_id);
        let t_connections = [];
        props.blocks.forEach((block) => {
            block.connections.forEach((connection) => {
                let next_block_id = connection.next_block_id;
                let prev_block_id = connection.prev_block_id;
                if (!next_block_id && !prev_block_id) return;
                if (typeof prev_block_id === 'string') {
                    let className = `in_${block.block_id}_${connection.role_id}`;
                    let start_pos = getCenterDOM(className);
                    // console.log([start_pos], className);

                    className = `out_${prev_block_id}_${connection.role_id}`;
                    let out_pos = getCenterDOM(className);
                    t_connections.push([start_pos, out_pos]);
                    // console.log([start_pos, out_pos], className);
                }
                if (prev_block_id && typeof prev_block_id === 'object') {
                    let className = `in_${block.block_id}_${connection.role_id}`;
                    let start_pos = getCenterDOM(className);
                    t_connections.push([start_pos, prev_block_id]);
                }
                if (next_block_id && typeof next_block_id === 'object') {
                    let className = `out_${block.block_id}_${connection.role_id}`;
                    let start_pos = getCenterDOM(className);
                    t_connections.push([start_pos, next_block_id]);
                }
            })
        })

        setConnections(t_connections);
    }, [props.blocks, props.zoom])



    return (<div>
        {
            connections ? connections.map((v, i) => {
                return <Connection key={i} pos={v} zoom={props.zoom} origin={props.origin}></Connection>
            }) : null
        }
    </div>)
}

function propsAreEqual(prev, next) {
    return prev.blocks === next.blocks && prev.zoom === next.zoom;
}

export default memo(Connections, propsAreEqual);