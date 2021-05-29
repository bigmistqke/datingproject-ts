import React, { memo, useEffect, useCallback, useState, useRef } from 'react';


import Hierarchy from "./Hierarchy.js"
import LayOut from "./LayOut.js"
import TextTypes from "./TextTypes.js"
import TextOptions from "./TextOptions.js"




const RightPanel = ({ guides, elements, shouldAddTextType, card_dim }) => {

    useEffect(() => {
        if (elements.state[elements.elementInFocus.state] &&
            elements.state[elements.elementInFocus.state].type.indexOf('text') != -1) {
            // console.log('text!');
        }
        // console.log(elements.state[elements.elementInFocus.state])
    }, [elements])
    return (
        <div className='gui gui_layout flex-container'>

            <Hierarchy
                elements={elements}
            ></Hierarchy>
            {
                elements.state[elements.elementInFocus.state] &&
                    elements.state[elements.elementInFocus.state].type.indexOf('text') != -1 ?
                    <TextOptions
                        elements={elements}
                        element={elements.state[elements.elementInFocus.state]}
                    ></TextOptions> :
                    null
            }
            <TextTypes
                shouldAddTextType={shouldAddTextType}
            ></TextTypes>
            <LayOut
                guides={guides}
                card_dim={card_dim}
                elements={elements}
            ></LayOut>
        </div>
    )
}

export default RightPanel