import { onMount } from "solid-js";

function TextArea(props) {
  let textarea_dom;
  onMount(resize);

  function resize() {
    textarea_dom.style.overflow = "hidden";
    textarea_dom.style.height = 0;
    textarea_dom.style.height = textarea_dom.scrollHeight + "px";
  }

  function onInput() {
    resize();
    actions.setDescriptionScript(textarea_dom.value);
  }
  return (
    <textarea
      placeholder="add description"
      ref={textarea_dom}
      value={props.value}
      onInput={onInput}
      style={props.style ? props.style : null}
    ></textarea>
  );
}

export default TextArea;
