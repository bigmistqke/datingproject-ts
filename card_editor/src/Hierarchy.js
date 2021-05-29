import React, { memo, useEffect, useCallback, useState, useRef } from 'react';
import { GUI_Container } from "./GUI_Components.js"


const Element = ({ id, element, elements }) => {
    const lockElement = (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!element.locked) {
            element.focused = false;
        } else {
            element.focused = true;
            elements.focus(id);
        }
        elements.update(id, { ...element, locked: !element.locked });

    }
    const changeOrder = (e) => {
        let oldZ = element.z;
        let newZ = parseInt(e.dataTransfer.getData("z"));

        let range = oldZ < newZ ? { min: oldZ, max: newZ } : { min: newZ, max: oldZ };


        Object.entries(elements.state).forEach(([id, element]) => {
            if (element.z >= range.min && element.z <= range.max) {
                if (element.z == newZ) {
                    element.z = oldZ;
                }
                else {
                    element.z = oldZ < newZ ? element.z + 1 : element.z - 1;
                }

                elements.update(id, element);
            }
        })
    }
    const allowDrag = (e) => {
        e.preventDefault()
    }

    const dragStart = (e) => {
        e.dataTransfer.setData("z", element.z);
    }

    const focusElement = e => {
        if (!element.locked)
            elements.focus(id);
    }

    const deleteElement = e => {
        e.preventDefault();
        e.stopPropagation();
        elements.delete(id);
    }
    return (<>
        <div
            onMouseDown={focusElement}
            className='hierarchy_element flex-container'
            style={{ background: elements.elementInFocus.state === id ? '#e6e3e3' : 'white' }}
            draggable="true"
            onDragStart={dragStart}
            onDragOver={allowDrag}
            onDrop={changeOrder}
        >
            <label >{element.z}</label>
            <span className='main'>{element.type} </span>
            <div className='button-container'>
                <button onMouseDown={lockElement}>{element.locked ? 'unlock' : 'lock'}</button>
                <button onMouseDown={deleteElement}>✕</button>
            </div>

        </div>
    </>)
}

const Hierarchy = ({ elements }) => {
    return (
        <GUI_Container label="Hierarchy">
            <div className='hierarchy-container'>
                {
                    elements ? Object.entries(elements.state).sort((a, b) => {
                        return b[1].z > a[1].z ? 1 : -1
                    }).map(([key, element]) => {
                        return <Element key={key} element={element} elements={elements} id={key}></Element>
                    }) : null
                }
            </div>

        </GUI_Container>
    )
}

export default Hierarchy