// import React, {useEffect, useRef } from 'react';
import { createEffect } from "solid-js";

const Log = ({ logText }) => {
  let log_ref;
  const showLog = () => {
    log_ref.classList.remove("hide");
    setTimeout(() => {
      log_ref.classList.add("hide");
    }, 3000);
  }

  createEffect(() => {
    if (!logText) return;
    showLog();
  }, [logText, log_ref])

  return <div ref={log_ref} className="hide log center-bottom">{logText}</div>
}

export default Log
