import "./Bubble.css";

import { createMemo } from "solid-js";
import getColorFromHue from "../helpers/getColorFromHue";
export default function Bubble(props) {
  const getStyle = createMemo(() => {
    console.log(props.background);
    let style = {};
    if (props.style) {
      style = { ...props.style };
    }
    if (props.margin) {
      style = { ...style, margin: margin };
    }
    if (props.backgroundColor) {
      style = { ...style, background: props.backgroundColor };
    }
    if (props.background_hue) {
      style = { ...style, background: getColorFromHue(props.background_hue) };
    }
    if (props.color) {
      style = { ...style, color: props.color };
    }
    console.log(style);
    return style;
  }, [props.background]);

  return props.onClick ? (
    <button
      className={`bubble ${props.className ? props.className : ""}`}
      style={getStyle()}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ) : (
    <span
      className={`bubble ${props.className ? props.className : ""}`}
      style={getStyle()}
    >
      {props.children}
    </span>
  );
}
