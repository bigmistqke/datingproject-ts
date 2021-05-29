import React, { memo, useEffect, useCallback, useState, useRef } from 'react';



const BottomPanel = ({ changeType, typeInFocus }) => {


    return (
        <div className='flex-container button-container bottom-panel'>
            <button className={`${typeInFocus === 'action' ? 'focus' : ''}`} onClick={() => { changeType('action') }}>action</button>
            <button className={`${typeInFocus === 'speech' ? 'focus' : ''}`} onClick={() => { changeType('speech') }}>speech</button>
            <button className={`${typeInFocus === 'thought' ? 'focus' : ''}`} onClick={() => { changeType('thought') }}>thought</button>
        </div >
    )
}

export default BottomPanel