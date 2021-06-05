import React, { memo, useEffect, useCallback, useState, useRef } from 'react';


import Hierarchy from "./Hierarchy.js"
import LayOut from "./LayOut.js"
import TextTypes from "./TextTypes.js"
import TextOptions from "./TextOptions.js"




const RightPanel = ({ guides, viewport, shouldAddTextType, card_dim }) => {

    /*     useEffect(() => {
            console.log(!!viewport.elementInFocus.state);
            if (!!viewport.elementInFocus.state &&
                viewport.state[viewport.elementInFocus.state] &&
                viewport.state[viewport.elementInFocus.state].type.indexOf('text') != -1) {
                // console.log('text!');
            }
            // console.log(viewport.state[viewport.elementInFocus.state])
        }, [viewport]) */
    return (
        <div className='gui gui_layout flex-container'>

            <Hierarchy
                viewport={viewport}
            ></Hierarchy>
            {
                !viewport.elementInFocus.state ? null :
                    viewport.state[viewport.elementInFocus.state] &&
                        viewport.state[viewport.elementInFocus.state].type &&
                        viewport.state[viewport.elementInFocus.state].type.indexOf('text') != -1 ?
                        <TextOptions
                            viewport={viewport}
                            element={viewport.state[viewport.elementInFocus.state]}
                        ></TextOptions> :
                        null
            }
            <TextTypes
                shouldAddTextType={shouldAddTextType}
            ></TextTypes>
            <LayOut
                guides={guides}
                card_dim={card_dim}
                viewport={viewport}
            ></LayOut>
        </div>
    )
}

export default RightPanel