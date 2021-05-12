import React, { useState, useEffect, useRef, useCallback } from 'react';
import Block from './Block';
import Connections from './Connections';
import {
    atom,
    useRecoilState
} from 'recoil';

const _blockManager = atom({ key: 'blockManager', default: '' });

function Map(props) {
    let [blockManager] = useRecoilState(_blockManager);

    let [connecting, setConnecting] = useState(false);
    let [origin, setOrigin] = useState({ x: 0, y: 0 });
    let r_origin = useRef({ x: 0, y: 0 });

    let r_map = useRef();
    let r_zoomValue = useRef(1);
    let r_zoomDom = useRef();

    let [render, setRender] = useState();

    let r_lastWheeled = useRef(0);
    let r_ctrlPressed = useRef(false);


    const throttle = useCallback((func, timeframe) => {
        var lastTime = 0;
        return function () {
            var now = performance.now();
            console.log(now, lastTime, now - lastTime, timeframe);
            if (now - lastTime >= timeframe) {
                lastTime = now;
                func();
            }
        };
    }, [])


    const createBlock = (e) => {
        e.preventDefault();
        const coords = {
            x: (e.clientX - r_origin.current.x),
            y: (e.clientY - r_origin.current.y) / r_zoomValue.current
        };
        blockManager.add(coords);
    }

    const zoom = (e) => {
        r_zoomValue.current = Math.max(Math.min(r_zoomValue.current + e.deltaY * 0.01, 1), 0.2);
        r_zoomDom.current.style.transform = `scale(${r_zoomValue.current})`;
        // r_zoomDom.current.style.transformOrigin = `${e.clientX + r_origin.current.x}px ${e.clientY + r_origin.current.x}px`;

        setRender(performance.now());
    }

    const scroll = (e) => {
        console.log(e.deltaY);
        let delta = e.deltaY;
        if (Math.abs(e.deltaY) === 3) delta = delta * 10
        let newCoords = { x: r_origin.current.x, y: r_origin.current.y + delta };
        r_map.current.style.transform = `translateX(${newCoords.x}px) translateY(${newCoords.y}px)`;
        // setOrigin(newCoords);
        // setRender(performance.now());
        r_origin.current = newCoords;
    }

    const navDown = useCallback((e) => {
        if (e.buttons === 2 || !e.target.classList.contains("map")) return;
        let newCoords, origin_delta;
        let startCoords = { x: e.clientX, y: e.clientY };

        console.log('navDown');

        const navMove = (e) => {
            console.log('navMove');
            origin_delta = { x: (startCoords.x - e.clientX) * -1, y: (startCoords.y - e.clientY) * -1 };
            newCoords = { x: r_origin.current.x + origin_delta.x, y: r_origin.current.y + origin_delta.y };
            r_map.current.style.transform = `translateX(${newCoords.x}px) translateY(${newCoords.y}px)`;
        }

        const navUp = (e) => {
            try {
                e.target.releasePointerCapture(e.pointerId);
            } catch (e) {
                console.log('releasePointerCapture is not available');
            }
            e.target.removeEventListener("pointermove", navMove);
            e.target.removeEventListener("pointerup", navUp);
            if (newCoords) r_origin.current = newCoords;
        }
        e.target.addEventListener("pointermove", navMove);
        e.target.addEventListener("pointerup", navUp);
        e.target.setPointerCapture(e.pointerId);

        e.preventDefault();
    }, [origin])



    useEffect(() => {
        window.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                r_ctrlPressed.current = true;
            }
        });
        window.addEventListener('keyup', (e) => {
            if (r_ctrlPressed.current && (!e.ctrlKey || !e.metaKey)) {
                r_ctrlPressed.current = false;
                console.log('ctrl unpressed!')
            }
        });
        r_map.current.parentElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            if ((e.ctrlKey || e.metaKey)) {
                if (performance.now() - r_lastWheeled.current > 30) {
                    zoom(e);
                    r_lastWheeled.current = performance.now();
                }
                return;
            } else {
                scroll(e);
            }
        }, true)
    }, [])



    return <div className="map-container" onPointerDown={navDown} onContextMenu={createBlock}>
        <div className={`map ${connecting ? 'connecting' : ''}`} >
            <div className="Map" ref={r_map}>
                <div className="zoom" ref={r_zoomDom}>

                    {
                        props.blocks ? props.blocks.map((block, i) => {
                            return [
                                <div
                                    className="absolute block_container" key={block.block_id}
                                >
                                    <Block
                                        id={block.block_id}
                                        block={block}
                                        instructions={props.instructions}
                                        connecting={props.connecting}
                                        connections={block.connections}
                                        roles={props.roles}
                                        errors={props.errors[block.block_id]}
                                        zoom={r_zoomValue.current}
                                        position={block.position}
                                    >
                                    </Block>
                                </div>]
                        }) : null
                    }

                </div>
                {props.blocks ? <Connections blocks={props.blocks} origin={r_origin.current} zoom={r_zoomValue.current}></Connections> : null}

            </div>
        </div>
    </div>
}

export default Map