import "./Overlay.css";

import { createMemo } from "solid-js";

const Overlay = function (props) {
  const closeOverlay = (e) => {
    if (!e.target.classList.contains("overlay-container")) return;
    props.onClose();
  };

  const getStyle = createMemo(() => {
    let style = {};
    if (props.style) {
      style = props.style;
    }
    if (typeof props.position === "object") {
      style = {
        ...style,
        left: `${parseInt(props.position.x)}px`,
        top: `${parseInt(props.position.y)}px`,
      };
    } else {
      if (props.position === "center") {
        style = {
          ...style,
          left: "50vw",
          top: "50vh",
          transform: "translate(-50%,-50%)",
        };
      }
    }
    return style;
  }, [props.position]);

  return (
    <div
      className={`overlay-container ${props.className ? props.className : ""}`}
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
