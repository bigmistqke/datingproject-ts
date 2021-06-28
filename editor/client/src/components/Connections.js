import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import Connection from './Connection';
import {
    atom,
    useRecoilState
} from 'recoil';

import State from "../helpers/react/State.js"

// const _props.blockManager = atom({ key: 'props.blockManager', default: '' });


const Connections = (props) => {
    // let [connections, setConnections] = useState([]);

    let connections = new State([]);

    let [render, setRender] = useState();
    // let [props.blockManager] = useRecoilState(_props.blockManager);

    let r_hasUpdated = useRef(false);


    let getCenterDOM = (className) => {
        let DOM = document.querySelector(`.${className}`);
        if (!DOM) return;
        let bound = DOM.getBoundingClientRect();
        let height_padding = className.indexOf('in') === -1 ? bound.height : 1;
        return { x: (bound.left + bound.width / 2), y: (bound.top + height_padding) };
    }

    /*     useEffect(() => {
            r_hasUpdated.current = false;
        }, [props.zoom])
    
        useEffect(() => {
            r_hasUpdated.current = false;
        }, [props.zoom]) */

    /* useEffect(() => {
        let deletedBlocks = props.blockManager.getDeletedBlocks();
        let deletedConnections = props.blockManager.getDeletedConnections();

        ////console.log(deletedBlocks, deletedConnections);

        if (deletedBlocks.length === 0 && deletedConnections.length === 0) return;

        let _connections = [...connections.get()];

        if (deletedBlocks.length > 0)
            _connections = _connections.filter(_c => deletedBlocks.indexOf(_c.in) === -1 || deletedBlocks.indexOf(_c.out) === -1);


        if (deletedConnections.length > 0) {
            _connections = _connections.filter(_c => {
                let result = deletedConnections.find(_d => _d.in === _c.in && _d.out === _c.out)
                ////console.log(!result);
                return !result;
            })
            r_hasUpdated.current = false;
        }

        props.blockManager.emptyDeletedBlocks();
        props.blockManager.emptyDeletedConnections();

        ////console.log('update connections !', _connections);

        connections.set(_connections);

    }, [props.blocks, connections]) */

    useEffect(() => {
        ////console.log('connections', connections);
    }, [connections])


    let updateOrAddConnection = useCallback(({ data, _connections }) => {
        ////console.log('updateOrAdd');
        let index = _connections.findIndex(c => {
            return c.in === data.in && c.out === data.out && c.role_id === data.role_id
        });
        if (index === -1) {
            _connections.push(data);
        }
        else {
            _connections[index] = data;
        }
        return _connections;
    }, [])



    /* 
        useEffect(() => {
            // let t_connections = [];
            let _connections = [...connections.get()];
            // let _connections = { ...connections };
            let updatedBlocks = props.blockManager.getUpdatedBlocks();
            props.blocks.forEach((block) => {
    
                block.connections.forEach((connection) => {
                    var next_block_id = connection.next_block_id;
                    let prev_block_id = connection.prev_block_id;
    
                    if (!next_block_id && !prev_block_id) return;
                    ////console.log('this happens');
                    if (prev_block_id && typeof prev_block_id === 'object') {
                        let className = `in_${block.block_id}_${connection.role_id}`;
                        let start_pos = getCenterDOM(className);
                        let data = { pos: [start_pos, prev_block_id], in: block.block_id, out: null, role_id: connection.role_id };
                        _connections = updateOrAddConnection({ data, _connections });
    
                    } else if (next_block_id && typeof next_block_id === 'object') {
                        let className = `out_${block.block_id}_${connection.role_id}`;
                        let start_pos = getCenterDOM(className);
                        let data = { pos: [start_pos, next_block_id], in: null, out: block.block_id, role_id: connection.role_id };
                        _connections = updateOrAddConnection({ data, _connections });
                    } else {
                        if (!updatedBlocks.find((v) => v.block_id === block.block_id) && r_hasUpdated.current) return;
    
                        if (next_block_id) {
    
                            let className = `in_${next_block_id}_${connection.role_id}`;
                            let start_pos = getCenterDOM(className);
                            className = `out_${block.block_id}_${connection.role_id}`;
                            let out_pos = getCenterDOM(className);
                            let data = { pos: [start_pos, out_pos], in: block.block_id, out: next_block_id, role_id: connection.role_id };
                            _connections = updateOrAddConnection({ data, _connections });
                        }
                        if (prev_block_id) {
                            let className = `in_${block.block_id}_${connection.role_id}`;
                            let start_pos = getCenterDOM(className);
                            className = `out_${prev_block_id}_${connection.role_id}`;
                            let out_pos = getCenterDOM(className);
                            let data = { pos: [start_pos, out_pos], in: prev_block_id, out: block.block_id, role: connection.role_id };
                            _connections = updateOrAddConnection({ data, _connections })
                        }
                    }
                })
            })
            r_hasUpdated.current = true;
            connections.set(_connections);
            props.blockManager.emptyUpdatedBlocks();
        }, [props.blocks, props.zoom, props.blockManager]) */



    return (<div>
        {
            connections.get() ? connections.get().map((v, i) => {
                return <Connection key={i} pos={v.pos} zoom={props.zoom} origin={props.origin}></Connection>
            }) : null
        }
    </div>)
}

function propsAreEqual(prev, next) {
    return prev.blocks === next.blocks
        && prev.zoom === next.zoom;
}

export default memo(Connections, propsAreEqual);