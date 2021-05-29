import { GUI_Panel } from "./GUI_Components.js"
import React, { memo, useEffect, useCallback, useState, useRef } from 'react';


const TextTypes = ({ shouldAddTextType }) => {
    useEffect(() => {
        // console.log(shouldAddTextType.state);
    }, [shouldAddTextType])
    return (
        <GUI_Panel label='Text Types'>
            <div className='button-container flex-container'>
                <button className={shouldAddTextType.state === 'text_type' ? 'focus' : ''} onClick={() => { shouldAddTextType.update('text_type') }}>Type</button>
                <button className={shouldAddTextType.state === 'text_instruction' ? 'focus' : ''} onClick={() => { shouldAddTextType.update('text_instruction') }}>Instruction</button>
                <button className={shouldAddTextType.state === 'text_custom' ? 'focus' : ''} onClick={() => { shouldAddTextType.update('text_custom') }}>custom</button>

            </div>
        </GUI_Panel>
    )
}

export default TextTypes