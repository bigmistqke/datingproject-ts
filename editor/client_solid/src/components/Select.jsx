import "./Select.css";
import { createSignal, For, createMemo, createEffect } from "solid-js";

function Select(props) {
  let [getFocus, setFocus] = createSignal(false);
  let select_dom;
  let drop_down_dom;

  const remainingOptions = createMemo(
    () => props.options.filter((option) => option != props.value),
    [props.options, props.value, props.options]
  );

  const closeDropDown = () => setFocus(false);

  const dropDown = (e) => {
    e.stopPropagation();
    setFocus(true);

    // TODO: maybe we will need to iterate through offsetParents
    // when there are nested CSS-transformed dom-elements

    let parent_style = window.getComputedStyle(select_dom.offsetParent);
    let select_style = window.getComputedStyle(select_dom);

    console.log(
      "select_dom.offsetLeft",
      select_dom.offsetParent,
      select_dom.offsetLeft - parseInt(select_style.marginLeft),
      parent_style.marginLeft
    );
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

  return (
    <>
      {getFocus() ? (
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
            <div onMouseUp={closeDropDown}>{props.value}</div>
            <For each={remainingOptions()}>
              {(option) => {
                return (
                  <div
                    onMouseUp={() => {
                      selectValue(option);
                    }}
                  >
                    {option}
                  </div>
                );
                /*  if (option !== getValue())
              <div
                onMouseDown={() => {
                  selectValue(option);
                }}
              >
                {option}
              </div>; */
              }}
            </For>
          </div>
        </>
      ) : null}

      <div
        ref={select_dom}
        //   className="select"
        onMouseUp={dropDown}
        className={props.className}
        classList={{
          select: true,
          focus: getFocus(),
        }}
      >
        {props.value}
      </div>
    </>
  );
}

export default Select;
