import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import Block from './Block';
import Connection from './Connection';

import normalizeWheel from 'normalize-wheel';

import State from "../helpers/react/State.js"

function Map(props) {

    let selectionBox = new State(false);

    // let [origin, setOrigin] = useState({ x: 0, y: 0 });
    // let r_origin = useRef({ x: 0, y: 0 });

    let r_map = useRef();

    let zoomValue = new State(1);

    let [render, setRender] = useState();

    let r_lastWheeled = useRef(0);
    let r_ctrlPressed = useRef(false);
    let r_shiftPressed = useRef(false);

    let [shiftPressed, setShiftPressed] = useState(false);
    let [ctrlPressed, setCtrlPressed] = useState(false);

    let r_cursor = useRef({ x: 0, y: 0 });

    let r_init = useRef(false);


    const throttle = useCallback((func, timeframe) => {
        var lastTime = 0;
        return function () {
            var now = performance.now();
            if (now - lastTime >= timeframe) {
                lastTime = now;
                func();
            }
        };
    }, [])


    const createBlock = (e) => {
        e.preventDefault();
        const coords = {
            x: (e.clientX - props.origin.x) / props.zoom,
            y: (e.clientY - props.origin.y) / props.zoom
        };
        props.blockManager.add(coords);
    }

    const zoomIn = useCallback((e) => {
        console.log('zoom in!');
        let new_zoom = props.getZoom() * 1.3;
        let _origin = props.getOrigin();

        let new_origin = {
            x: _origin.x + (0.3) * (_origin.x - window.innerWidth / 2),
            y: _origin.y + (0.3) * (_origin.y - window.innerHeight / 2)
        }

        props.setOrigin(new_origin);

        props.setZoom(new_zoom);


        setTimeout(() => {
            setRender(performance.now());
        }, 0)
    }, [r_map, props.zoom, props.origin])

    const zoomOut = useCallback((e) => {
        console.log('zoom out!');
        let new_zoom = props.getZoom() * 0.7;
        let _origin = props.getOrigin();

        let new_origin = {
            x: _origin.x - (0.3) * (_origin.x - window.innerWidth / 2),
            y: _origin.y - (0.3) * (_origin.y - window.innerHeight / 2)
        }

        console.log(new_zoom);

        props.setOrigin(new_origin);
        props.setZoom(new_zoom);
    }, [r_map, props.zoom, props.getOrigin])

    const zoom = (e) => {
        let normalized = normalizeWheel(e);
        let speed = -0.025;
        let delta = Math.min(3, Math.max(normalized.pixelY, -3)) * speed;
        let new_zoom = Math.max(Math.min(props.zoom + delta, 1), 0.2);
        props.setZoom(new_zoom);

        // props.zoom =
        setRender(performance.now());
    }

    const scroll = useCallback((e) => {
        let normalized = normalizeWheel(e);
        let speed = -10;
        let new_origin = { x: props.origin.x + normalized.spinX * speed, y: props.origin.y + normalized.spinY * speed };
        r_map.current.style.transform = `translateX(${new_origin.x}px) translateY(${new_origin.y}px)`;
        props.setOrigin(new_origin);

    }, [r_map])

    const processNavigation = useCallback((e) => {
        if (!e.target.classList.contains('map-container')) return;
        if (e.buttons === 2) return;
        let new_origin, origin_delta;
        let startCoords = { x: e.clientX, y: e.clientY };
        let now = performance.now();

        const move = (e) => {
            let _origin = props.getOrigin();

            if (r_shiftPressed.current) {
                selectionBox.set({
                    width: ((startCoords.x - e.clientX) * -1) / props.zoom,
                    height: ((startCoords.y - e.clientY) * -1) / props.zoom,
                    top: (startCoords.y - _origin.y) / props.zoom,
                    left: (startCoords.x - _origin.x) / props.zoom
                })
                if (performance.now() - now < 100) return;
                now = performance.now();
                // todo: selection
                let _selectionBox = selectionBox.get();
                let collisions = props.blocks.get().filter(_block => {
                    if (!_block.boundingBox) return;
                    return (
                        _block.boundingBox.left < _selectionBox.left + _selectionBox.width &&
                        _block.boundingBox.left + _block.boundingBox.width > _selectionBox.left &&
                        _block.boundingBox.top < _selectionBox.top + _selectionBox.height &&
                        _block.boundingBox.top + _block.boundingBox.height > _selectionBox.top
                    )
                })

                collisions.forEach(({ block_id }) => props.blockManager.selectBlock({ block_id }));
                if (!r_ctrlPressed.current) {
                    const deselectBlocks = props.blockManager.getSelectedBlocks().filter(v => !collisions.find(c => c.block_id === v.block_id));
                    deselectBlocks.forEach(({ block_id }) => { props.blockManager.deselectBlock({ block_id }) })
                }
            } else {
                origin_delta = { x: (startCoords.x - e.clientX) * -1, y: (startCoords.y - e.clientY) * -1 };
                new_origin = { x: _origin.x + origin_delta.x, y: _origin.y + origin_delta.y };
                // r_map.current.style.transform = `translateX(${new_origin.x}px) translateY(${new_origin.y}px)`;

                props.setOrigin(new_origin);



                startCoords = { x: e.clientX, y: e.clientY };
            }
        }

        const end = (e) => {
            try {
                e.target.releasePointerCapture(e.pointerId);
            } catch (e) {
                console.info('releasePointerCapture is not available');
            }
            e.target.removeEventListener("pointermove", move);
            e.target.removeEventListener("pointerup", end);
            // if (new_origin) props.setOrigin(new_origin);
            if (r_shiftPressed.current) {
                selectionBox.set(false)
            }
        }
        e.target.addEventListener("pointermove", move);
        e.target.addEventListener("pointerup", end);
        e.target.setPointerCapture(e.pointerId);

        e.preventDefault();

    }, [props.blockManager, props.zoom, props.getOrigin])


    useEffect(() => {
        if (!props.blockManager) return;
        window.addEventListener('mousemove', (e) => {
            r_cursor.current.x = e.clientX;
            r_cursor.current.y = e.clientY;
        })
        document.body.addEventListener('keydown', (e) => {
            // e.stopPropagation();
            console.log('keydown', e.code, e.key, e.ctrlKey, e.shiftKey, r_ctrlPressed.current);


            if (e.code === 'ArrowUp' && r_ctrlPressed.current) {
                e.preventDefault();

                zoomIn();
            }
            if (e.code === 'ArrowDown' && r_ctrlPressed.current) {
                e.preventDefault();
                zoomOut();
            }

            if (e.code === 'KeyD' && r_ctrlPressed.current) {
                e.preventDefault();
                props.blockManager.duplicateSelectedBlocks({ cursor: r_cursor.current, zoom: props.zoom });
            }
            if (e.ctrlKey || e.key === "Meta") {
                r_ctrlPressed.current = true;
                setCtrlPressed(true);
                console.log('set ctrl to true');
            }
            if (e.shiftKey || e.key === "Shift") {
                r_shiftPressed.current = true;
                setShiftPressed(true);
            }

        });
        window.addEventListener('keyup', (e) => {
            console.log('keyup', e.code, e.key, e.ctrlKey, e.shiftKey, r_ctrlPressed.current);


            if (r_ctrlPressed.current && (!e.ctrlKey || e.code === "Meta")) {
                r_ctrlPressed.current = false;
                console.log('set ctrl to false');

                setCtrlPressed(false);
            }
            if (r_shiftPressed.current && (!e.shiftKey || e.code === "Shift")) {
                setShiftPressed(false);

                r_shiftPressed.current = false;
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
    }, [props.blockManager])

    useEffect(() => {
        if (props.blockManager && props.blocks.get() && !r_init.current) {
            setTimeout(() => {
                r_init.current = true;
                props.blockManager.calculateConnections({});
            }, 500)
            setTimeout(() => {
                r_init.current = true;
                props.blockManager.calculateConnections({});
            }, 0)
        }

    }, [props.blockManager, props.blocks])



    function SelectionBox({ data }) {
        return <div className='selectionBox' style={{ top: data.top, left: data.left, width: data.width, height: data.height }}></div>
    }


    return <div className="map-container" onPointerDown={processNavigation} onContextMenu={createBlock}>
        <div className={`map ${props.connecting ? 'connecting' : ''}`}
            ref={r_map} style={{ transform: `translateX(${props.origin.x}px) translateY(${props.origin.y}px)` }}>
            <div className="zoom" style={{ transform: `scale(${props.zoom})` }}>

                {
                    props.blocks.get() ? props.blocks.get().map((block, i) => {
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
                                    errors={props.errors.get()[block.block_id]}
                                    zoom={props.zoom}
                                    position={block.position}
                                    selected={block.selected}
                                    origin={props.origin}
                                    ctrlPressed={ctrlPressed}
                                    shiftPressed={shiftPressed}
                                    blockManager={props.blockManager}
                                    instructionManager={props.instructionManager}
                                    videoUploader={props.videoUploader}

                                >
                                </Block>
                            </div>]
                    }) : null
                }
                {props.connections ? props.connections.map((v, i) => {
                    return <Connection key={i} pos={v.pos} zoom={props.zoom} origin={props.origin} ></Connection>
                }) : null}
                {selectionBox.get() ? <SelectionBox data={selectionBox.get()}></SelectionBox> : null}


            </div>
            {/* {props.connections ? <Connections  blockManager={props.blockManager} blocks={props.blocks} origin={props.origin} zoom={props.zoom}></Connections> : null} */}

        </div>
    </div>
}


function propsAreEqual(prev, next) {
    return prev.origin === next.origin &&
        prev.blocks === next.blocks &&
        prev.instructions === next.instructions &&
        prev.instructions_get === next.instructions_get &&
        prev.errors === next.errors &&
        prev.shiftPressed === next.shiftPressed &&
        prev.ctrlPressed === next.ctrlPressed &&
        prev.selected === next.selected &&
        prev.zoom === next.zoom &&
        prev.roles === next.roles &&
        prev.connecting === next.connecting;
}

export default memo(Map, propsAreEqual);
