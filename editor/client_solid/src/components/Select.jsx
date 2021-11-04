import "./Select.css";
import { createSignal, For, createMemo, createEffect } from "solid-js";

function Select(props) {
  let [getFocus, setFocus] = createSignal(false);
  let select_dom;
  let drop_down_dom;

  let [selected_label, setSelectedLabel] = createSignal();

  const remainingOptions = createMemo(() =>
    props.options.filter((option) => {
      return option.value !== props.value;
    })
  );

  createEffect(() => {
    setSelectedLabel(
      props.options.find((option) => option.value === props.value)
        ? props.options.find((option) => option.value === props.value).label
        : null
    );
  });

  const closeDropDown = () => setFocus(false);

  const openDropDown = (e) => {
    e.stopPropagation();
    setFocus(true);

    // TODO: maybe we will need to iterate through offsetParents
    // when there are nested CSS-transformed dom-elements

    let parent_style = window.getComputedStyle(select_dom.offsetParent);
    let select_style = window.getComputedStyle(select_dom);

    drop_down_dom.style.left =
      select_dom.offsetLeft +
      parseInt(parent_style.marginLeft) -
      parseInt(select_style.marginLeft) +
      "px";

    drop_down_dom.style.top =
      select_dom.offsetTop +
      parseInt(parent_style.marginTop) -
      parseInt(select_style.marginTop) +
      "px";

    let total_width =
      parseInt(select_style.width) +
      parseInt(select_style.marginLeft) +
      parseInt(select_style.marginRight) +
      parseInt(select_style.paddingRight) +
      parseInt(select_style.paddingLeft);

    drop_down_dom.style.width = total_width + "px";
  };

  const selectValue = (value) => {
    closeDropDown();
    props.onInput(value);
  };

  const DropDown = () => (
    <>
      <div
        classList={{
          focus: getFocus(),
        }}
        className="close-select"
        onMouseDown={closeDropDown}
      ></div>
      <div
        ref={drop_down_dom}
        classList={{
          drop_down: true,
          focus: getFocus(),
        }}
      >
        <div onMouseUp={closeDropDown}>{selected_label}</div>
        <For each={remainingOptions()}>
          {(option) => (
            <div onMouseUp={() => selectValue(option.value)}>
              {option.label}
            </div>
          )}
        </For>
      </div>
    </>
  );

  return (
    <>
      {getFocus() ? <DropDown></DropDown> : null}
      <div
        ref={select_dom}
        onMouseUp={openDropDown}
        className={props.className}
        classList={{
          select: true,
          focus: getFocus(),
        }}
      >
        {selected_label}
      </div>
    </>
  );
}

export default Select;
