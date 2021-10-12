import "./Overlay.css";

import { createMemo } from "solid-js";

const Overlay = function (props) {
  const closeOverlay = (e) => {
    console.log(props.header);
    console.log(e);
    if (!e.target.classList.contains("overlay-container")) return;
    props.onClose();
  };

  const getStyle = createMemo(() => {
    if (typeof props.position === "object") {
      return {
        left: `${parseInt(props.position.x)}px`,
        top: `${parseInt(props.position.y)}px`,
      };
    } else {
      if (props.position === "center") {
        return {
          left: "50vw",
          top: "50vh",
          transform: "translate(-50%,-50%)",
        };
      }
    }
  }, [props.position]);

  return (
    <div
      className={`overlay-container ${props.className}`}
      onMouseDown={closeOverlay}
    >
      <div style={getStyle()} className="overlay ">
        <header>{props.header}</header>
        <div className="flex overlay-body">{props.children}</div>
      </div>
    </div>
  );
};

export default Overlay;
