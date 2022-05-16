import "./Bubble.css";

import { createMemo, createSignal, onMount } from "solid-js";
import getColorFromHue from "../helpers/getColorFromHue";
import { getCaretPosition, setCaretPosition } from "../helpers/CaretPosition";
export default function Bubble(props) {
  let [getValueOnFocus, setValueOnFocus] = createSignal("");

  const getStyle = createMemo(() => {
    let style = {};
    if (props.style) style = { ...props.style };
    if (props.margin) style = { ...style, margin: margin };
    if (props.color) style = { ...style, color: props.color };
    if (props.background_color)
      style = {
        ...style,
        background: props.background_color,
      };
    if (props.background_hue)
      style = {
        ...style,
        background: getColorFromHue(props.background_hue),
      };
    return style;
  }, [props.background]);

  const onBlur = () => {
    if (props.ref.innerText === "") {
      props.ref.innerHTML = getValueOnFocus();
    } else {
      props.ref.innerHTML = props.ref.innerText;
      if (props.ref.innerText != getValueOnFocus()) {
        if (props.onChange) props.onChange(props.ref.innerText);
      }
    }
  };

  const onKeyUp = () => {
    if (props.onChange) {
      if (props.ref.innerText === "") {
        props.onChange(props.ref.innerText);
      } else {
        let caret_position = getCaretPosition(props.ref);
        props.onChange(props.ref.innerText);
        props.ref.innerHTML = props.ref.innerText;
        setCaretPosition(props.ref, caret_position);
      }
    }
  };

  const onFocus = (e) => setValueOnFocus(e.target.innerText);

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
      contentEditable={props.contentEditable}
      ref={props.ref}
      class={`bubble ${props.class ? props.class : ""}`}
      style={getStyle()}
      onFocus={onFocus}
      onKeyUp={onKeyUp}
      onBlur={onBlur}
      onMouseOut={props.onMouseOut}
      onMouseEnter={props.onMouseEnter}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
      onContextMenu={props.onContextMenu}
    >
      {props.children}
    </span>
  );
}
