import "./Bubble.css";

import { createMemo, createSignal } from "solid-js";
import getColorFromHue from "../helpers/getColorFromHue";
import { getCaretPosition, setCaretPosition } from "../helpers/CaretPosition";
export default function Bubble(props) {
  let [getValueOnFocus, setValueOnFocus] = createSignal("");
  let span_ref;
  let [getIsFocused, setIsFocused] = createSignal(false);

  const getStyle = createMemo(() => {
    let style = {};
    if (props.style) {
      style = { ...props.style };
    }
    if (props.margin) {
      style = { ...style, margin: margin };
    }
    if (props.background_color) {
      style = { ...style, background: props.background_color };
    }
    if (props.background_hue) {
      style = { ...style, background: getColorFromHue(props.background_hue) };
    }
    if (props.color) {
      style = { ...style, color: props.color };
    }
    return style;
  }, [props.background]);

  const onBlur = () => {
    if (span_ref.innerText === "") {
      span_ref.innerHTML = getValueOnFocus();
    } else {
      span_ref.innerHTML = span_ref.innerText;
      if (span_ref.innerText != getValueOnFocus()) {
        if (props.onChange) props.onChange(span_ref.innerText);
      }
    }
    setIsFocused(false);
  };

  // removed because it kept on reset the caret to the start
  const onKeyUp = () => {
    if (props.onChange) {
      // span_ref.innerHTML = span_ref.innerText
      if (span_ref.innerText === "") {
        props.onChange(span_ref.innerText);
      } else {
        let caret_position = getCaretPosition(span_ref);
        props.onChange(span_ref.innerText);
        span_ref.innerHTML = span_ref.innerText;
        setCaretPosition(span_ref, caret_position);
      }
    }
  };

  const onFocus = (e) => {
    setIsFocused(true);
    setValueOnFocus(e.target.innerText);
  };

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
      ref={span_ref}
      className={`bubble ${props.className ? props.className : ""}`}
      style={getStyle()}
      onFocus={onFocus}
      onKeyUp={onKeyUp}
      onBlur={onBlur}
      onMouseOut={props.onMouseOut}
      onMouseEnter={props.onMouseEnter}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
      onContextMenu={props.onContextMenu}
      ref={props.ref}
    >
      {props.children}
    </span>
  );
}
