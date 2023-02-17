import React, {useEffect, useRef } from 'react';

const Log = ({logText}) => {
    let log_ref = useRef();
    const showLog = () => {
        log_ref.current.classList.remove("hide");
        setTimeout(()=>{
            log_ref.current.classList.add("hide");
        }, 3000);
    }

    useEffect(()=>{
        if(!logText) return;
        showLog();
    }, [logText, log_ref])

    return <div ref={log_ref} className="hide log center-bottom">{logText}</div>
}

export default Log
