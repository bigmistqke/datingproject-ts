import React, { useState, useEffect, useRef, forwardRef } from 'react';
import Block from './Block';
import Connectors from './Connectors';
import {
    atom,
    useRecoilState
} from 'recoil';

const _blockManager = atom({ key: 'blockManager', default: '' });

const Map = (props) => {
    let [blockManager] = useRecoilState(_blockManager);

    let [connecting, setConnecting] = useState(false);
    let [origin, setOrigin] = useState({ x: 0, y: 0 });
    let r_map = useRef();


    const createBlock = (e) => {
        e.preventDefault();
        const coords = { x: e.clientX - origin.x, y: e.clientY - origin.y };
        blockManager.add(coords);
    }

    const navDown = (e) => {
        console.log('this?')
        if (e.buttons === 2 || !e.target.classList.contains("map")) return;
        console.log('that');
        let newCoords, origin_delta;

        const navMove = (e) => {
            origin_delta = { x: (startCoords.x - e.clientX) * -1, y: (startCoords.y - e.clientY) * -1 };
            newCoords = { x: origin.x + origin_delta.x, y: origin.y + origin_delta.y };

            r_map.current.style.transform = `translateX(${newCoords.x}px) translateY(${newCoords.y}px)`;
            // 
        }

        const navUp = (e) => {
            try {
                e.target.releasePointerCapture(e.pointerId);
            } catch (e) {
                console.log('releasePointerCapture is not available');
            }
            e.target.removeEventListener("pointermove", navMove);
            e.target.removeEventListener("pointerup", navUp);
            if (newCoords) setOrigin(newCoords);
        }
        e.target.addEventListener("pointermove", navMove);
        e.target.addEventListener("pointerup", navUp);
        e.target.setPointerCapture(e.pointerId);

        let startCoords = { x: e.clientX, y: e.clientY };
        e.preventDefault();
    }

    useEffect(() => {
        console.log(props.overlay);
    }, [props.overlay]);

    return <div className="map-container" onPointerDown={navDown} onContextMenu={createBlock}>
        <div className={`map${connecting ? ' connecting' : ''}`} >
            <div className="Map" ref={r_map}>
                {props.blocks ? <Connectors blocks={props.blocks} origin={origin}></Connectors> : null}
                {
                    props.blocks ? props.blocks.map((block, i) => {
                        return <div
                            className="absolute block_container" key={i} style={{ transform: `translateX(${block.position.x}px) translateY(${block.position.y}px)` }}>
                            <Block
                                key={block.block_id}
                                id={block.block_id}
                                block={block}
                                instructions={props.instructions}
                                connecting={props.connecting}
                                roles={props.roles}
                                errors={props.errors[block.block_id]}
                            >
                            </Block>
                        </div>
                    }) : null
                }
            </div>
        </div>
    </div>
}

export default Map