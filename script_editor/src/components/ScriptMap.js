import React, { useState, useEffect, useRef, forwardRef } from 'react';
import ScriptBlock from './ScriptBlock';
import Connectors from './Connectors';

const ScriptMap = (props) => {

    let [connecting, setConnecting] = useState(false);
    let [origin, setOrigin] = useState({ x: 0, y: 0 });
    let r_map = useRef();


    const createBlock = (e) => {
        e.preventDefault();
        const coords = { x: e.clientX - origin.x, y: e.clientY - origin.y };
        // setOrigin(coords);
        console.log(props);
        props.blockManager.add(coords);
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
                {props.r_blocks ? <Connectors blocks={props.r_blocks} origin={origin}></Connectors> : null}
                {
                    props.r_blocks ? props.blocks.map((block, i) => {
                        console.log(block.block_id);
                        return <div
                            className="absolute" key={i} style={{ transform: `translateX(${block.position.x}px) translateY(${block.position.y}px)` }}>
                            <ScriptBlock
                                key={block.block_id}
                                id={block.block_id}
                                instructionManager={props.instructionManager}
                                blockManager={props.blockManager}
                                block={block}
                                instructions={props.instructions}
                                connecting={props.connecting}
                                allRoles={props.allRoles}
                            >
                            </ScriptBlock>
                        </div>
                    }) : null
                }
            </div>
        </div>
    </div>
}

export default ScriptMap