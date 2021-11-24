import React, { memo, useEffect, useCallback, useState, useRef } from 'react';


import uniqid from "uniqid"



const CardElement = ({ id, text, element, type, children }) => {
    useEffect(() => {
        console.log(element);
    }, [element])

    const Type = ({ element }) => {

        console.log('type', type);
        switch (element.type) {
            case 'image':
                return <img src={`${window._url.fetch}/api/${element.src}`}></img>;
            case 'text_type':
                return <span>{type}</span>;
            case 'text_instruction':
                return <span>eplgprwlgw</span>;
            case 'text_custom':
                return <span>{ }</span>;
            default:
                return null;
        }
    }

    return (
        <div
            className={`element`}
            id={id}
            style={{
                width: element.dim.width + '%',
                height: element.dim.height + '%',
                top: element.origin.y + '%',
                left: element.origin.x + '%',
                pointerEvents: element.isDrawing || element.locked ? 'none' : 'all',
                zIndex: element.z,
                textAlign: element.options ? element.options.alignmentHorizontal : null,
                alignItems: element.options ? element.options.alignmentVertical : null,
                fontSize: element.options ? `${element.options.size}pt` : null,
                fontFamily: element.options ? element.options.family : null,
                letterSpacing: element.options ? element.options.spacing : null,
                lineHeight: element.options ? `${element.options.lineHeight}pt` : null,
                color: element.options ? element.options.color : null,
                textShadow: element.options ? `${element.options.shadowLeft}px ${element.options.shadowTop}px ${element.options.shadowBlur}px ${element.options.shadowColor}` : null
            }}
        >
            <Type element={element}></Type>
            {children}

        </div>
    )
}

export default CardElement;
