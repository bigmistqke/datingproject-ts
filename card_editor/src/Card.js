import React, { memo, useEffect, useCallback, useState, useRef } from 'react';
import ResizeHandles from "./ResizeHandles.js"
import uniqid from "uniqid"



const Card = ({ children, updateCardDim, card_dim, elements, shouldSnap, shouldAddTextType }) => {

    let r_card = useRef();

    useEffect(() => {
        _updateCardDim();
    }, [r_card])



    const _updateCardDim = useCallback(() => {
        updateCardDim(r_card.current.getBoundingClientRect());
    }, [updateCardDim, r_card])

    useEffect(() => {
        window.onresize = (e) => {
            _updateCardDim();
        }
    }, [updateCardDim])

    const drawStart = useCallback(e => {

        if (!shouldAddTextType.state) {
            elements.focus(false)
            return
        };
        shouldAddTextType.update(false);
        let id = uniqid();

        let start_origin = {
            x: (e.clientX - card_dim.left) / card_dim.width * 100,
            y: (e.clientY - card_dim.top) / card_dim.height * 100
        };

        let element = {
            type: shouldAddTextType.state,
            drawing: {
                origin: { ...start_origin },
                cursor: { ...start_origin }
            },
            origin: { ...start_origin },
            dim: { width: 0, height: 0 },
            locked: false,
            z: Object.values(elements.state).length,
            options: {
                size: shouldAddTextType.state === 'text_instruction' ? 24 : 16,
                lineHeight: shouldAddTextType.state === 'text_instruction' ? 26 : 18,
                family: 'arial',
                spacing: 0,
                alignmentHorizontal: 'center',
                alignmentVertical: 'center',
                color: 'black',
                shadowLeft: 0,
                shadowTop: 0,
                shadowBlur: 0,
                shadowColor: 'black'
            },
        };

        elements.update(id, element);
        setTimeout(() => {
            elements.focus(id);

        }, 0)


        function update(e) {
            element.drawing.cursor = {
                x: (e.clientX - card_dim.left) / card_dim.width * 100,
                y: (e.clientY - card_dim.top) / card_dim.height * 100
            };

            let width = element.drawing.cursor.x - element.drawing.origin.x;
            let height = element.drawing.cursor.y - element.drawing.origin.y;

            element.dim.width = Math.abs(width);
            element.dim.height = Math.abs(height);

            element.origin = {
                x: element.drawing.origin.x < element.drawing.cursor.x ? element.drawing.origin.x : element.drawing.cursor.x,
                y: element.drawing.origin.y < element.drawing.cursor.y ? element.drawing.origin.y : element.drawing.cursor.y,
            }
            elements.update(id, element);
            // console.log(elements.state);

            // setRender(performance.now());
        }
        const finish = e => {
            if (element.dim.height < 5 && element.dim.width < 5) {
                elements.delete(id);
            }
            window.removeEventListener('mousemove', update, true);
            window.removeEventListener('mouseup', finish, true);
            element.drawing = false;
        }
        window.addEventListener('mousemove', update, true);
        window.addEventListener('mouseup', finish, true);
    }, [elements, r_card, card_dim])



    return (
        <div className="card" onMouseDown={drawStart} ref={r_card}>
            {children}
        </div>

    )
}

export default Card