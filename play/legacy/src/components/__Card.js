import React, { useEffect, useState, useRef, useCallback } from 'react';
import CardElement from "./CardElement.js"

const _Card = function ({ offset, zIndex, instruction_id, dataurl,
    text, type, timespan, flip, waitYourTurn, swipeAction, video, designs }) {


    useEffect(() => {
        console.log('design', designs, type);
    }, [designs]);
    return <>
        {
            designs && designs[type] ? Object.entries(designs[type]).map(([id, element]) => {
                console.log('element', element, id, type);

                return <CardElement
                    key={id}
                    id={id}
                    element={element}


                    loremIpsum=''
                // typeInFocus={design.typeInFocus}
                >
                </CardElement>
            }

            ) : null
        }
    </>
}

export default _Card