import React, { memo, useEffect, useCallback, useState, useRef } from 'react';



const BottomPanel = ({ changeType, typeInFocus }) => {


    return (
        <div className='flex-container button-container bottom-panel'>
            <button className={`${typeInFocus === 'do' ? 'focus' : ''}`} onClick={() => { changeType('do') }}>action</button>
            <button className={`${typeInFocus === 'say' ? 'focus' : ''}`} onClick={() => { changeType('say') }}>speech</button>
            <button className={`${typeInFocus === 'think' ? 'focus' : ''}`} onClick={() => { changeType('think') }}>thought</button>
        </div >
    )
}

export default BottomPanel