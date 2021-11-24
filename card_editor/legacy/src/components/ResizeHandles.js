import React, { memo, useEffect, useCallback, useState, useRef } from 'react';

const ResizeHandles = ({ guides, card_dim, id, el, viewport, shiftPressed, altPressed }) => {
    const ResizeHandle = ({ direction }) => {
        const checkGuides = () => {

        }

        const r_shiftPressed = useRef(shiftPressed);
        useEffect(() => {
            r_shiftPressed.current = shiftPressed;
        }, [shiftPressed])

        const r_altPressed = useRef(altPressed);
        useEffect(() => {
            r_altPressed.current = altPressed;
        }, [altPressed])

        const resizeTop = (_el, delta) => {
            let snap_guide = Object.values(guides.state).find(guide => {
                if (guide.direction === 'horizontal') {
                    let new_origin = Math.abs(_el.origin.y - delta.y - guide.position);
                    return new_origin < 1;
                }
            });
            if (snap_guide) {
                el.origin.y = snap_guide.position;
                let offset = _el.origin.y - delta.y - snap_guide.position;
                el.dim.height = _el.dim.height + delta.y + offset;
            } else {
                el.origin.y = _el.origin.y - delta.y;
                el.dim.height = _el.dim.height + delta.y;
            }
        }

        const resizeRight = (_el, delta) => {
            let snap_guide = Object.values(guides.state).find(guide => {
                if (guide.direction === 'vertical') {
                    let new_origin = Math.abs(_el.origin.x + _el.dim.width - delta.x - guide.position);
                    return new_origin < 1;
                }
            });
            if (snap_guide) {
                let offset = snap_guide.position - _el.origin.x;
                el.dim.width = offset;
            } else {
                el.dim.width = _el.dim.width - delta.x;
            }
            // TODO :  shiftpressed with snaps
            if (r_shiftPressed.current) {
                el.dim.width -= delta.x;
                el.origin.x = _el.origin.x + delta.x;
            }
        }

        const resizeLeft = (_el, delta) => {
            let snap_guide = Object.values(guides.state).find(guide => {
                if (guide.direction === 'vertical') {
                    let new_origin = Math.abs(_el.origin.x - delta.x - guide.position);
                    return new_origin < 1;
                }
            });
            if (snap_guide) {
                el.origin.x = snap_guide.position;
                let offset = _el.origin.x - delta.x - snap_guide.position;
                el.dim.width = _el.dim.width + delta.x + offset;
            } else {
                el.origin.x = _el.origin.x - delta.x;
                el.dim.width = _el.dim.width + delta.x;

            }
            // TODO :  shiftpressed with snaps
            if (r_shiftPressed.current) {
                el.dim.width += delta.x;
            }
        }

        const resizeBottom = (_el, delta) => {
            let snap_guide = Object.values(guides.state).find(guide => {
                if (guide.direction === 'horizontal') {
                    let new_origin = Math.abs(_el.origin.y + _el.dim.height - delta.y - guide.position);
                    return new_origin < 1;
                }
            });
            if (snap_guide) {
                let offset = snap_guide.position - _el.origin.y;
                el.dim.height = offset;
            } else {
                el.dim.height = _el.dim.height - delta.y;
            }
            // TODO: shiftpressed with snaps
            if (r_shiftPressed.current) {
                el.origin.y = _el.origin.y + delta.y;
                el.dim.height -= delta.y;
            }
        }

        const resizeStart = useCallback((e) => {
            if (el.locked) return;

            e.preventDefault();
            e.stopPropagation();

            let cursorStart = {
                x: e.clientX - card_dim.left,
                y: e.clientY - card_dim.top
            };

            let _el = JSON.parse(JSON.stringify(el));
            let aspect_ratio = _el.dim.width / el.dim.height;



            function update(e) {
                e.preventDefault();

                let cursorNow = {
                    x: e.clientX - card_dim.left,
                    y: e.clientY - card_dim.top
                };
                let delta = {
                    x: (cursorStart.x - cursorNow.x) / card_dim.width * 100,
                    y: (cursorStart.y - cursorNow.y) / card_dim.height * 100,
                };




                console.log('r_altPressed.current', r_altPressed.current);

                switch (direction) {
                    case "top":
                        resizeTop(_el, delta);
                        break;
                    case "bottom":
                        resizeBottom(_el, delta);
                        break;
                    case "left":
                        resizeLeft(_el, delta);
                        break;
                    case "right":
                        resizeRight(_el, delta);
                        break;
                    case 'top_right':
                        resizeTop(_el, delta);
                        resizeRight(_el, delta);
                        break;
                    case 'top_left':
                        resizeTop(_el, delta);
                        resizeLeft(_el, delta);
                        break;
                    case 'bottom_left':
                        resizeBottom(_el, delta);
                        resizeLeft(_el, delta);
                        break;
                    case 'bottom_right':
                        resizeBottom(_el, delta);
                        resizeRight(_el, delta);
                        break;

                }

                viewport.update(id, el);
            }

            const finish = e => {
                window.removeEventListener('mousemove', update, true);
                window.removeEventListener('mouseup', finish, true);
            }

            window.addEventListener('mousemove', update, true);
            window.addEventListener('mouseup', finish, true);
        }, [card_dim, guides, viewport, el])

        return <div className={`resize ${direction}`} onMouseDown={resizeStart}></div>
    }
    return (
        <>
            <ResizeHandle direction='top' ></ResizeHandle>
            <ResizeHandle direction='top_left' ></ResizeHandle>
            <ResizeHandle direction='top_right' ></ResizeHandle>
            <ResizeHandle direction='bottom' ></ResizeHandle>
            <ResizeHandle direction='bottom_left' ></ResizeHandle>
            <ResizeHandle direction='bottom_right' ></ResizeHandle>
            <ResizeHandle direction='left' ></ResizeHandle>
            <ResizeHandle direction='right' ></ResizeHandle>
        </>
    )
}


export default ResizeHandles;