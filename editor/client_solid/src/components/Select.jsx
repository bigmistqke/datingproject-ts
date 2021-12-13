import "./Select.css";
import { createSignal, For, createMemo, createEffect } from "solid-js";

function Select(props) {
  let [getFocus, setFocus] = createSignal(false);
  let select_dom;
  let drop_down_dom;

  const getRemainingOptions = createMemo(() => {
    return props.options.filter((option) => {
      return option.value !== props.value;
    });
  });

  const getSelectedLabel = createMemo(() =>
    props.options.find((option) => option.value === props.value)
      ? props.options.find((option) => option.value === props.value).label
      : null
  );

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

  // .select {
  //   height: inherit;
  //   position: relative;
  // }
  // .select.focus {
  //   position: initial;
  // }
  // .drop_down {
  //   box-sizing: border-box;
  // }
  // .drop_down.focus {
  //   /* overflow: hidden; */
  //   display: inline-block;

  //   background: var(--dark-grey) !important;
  //   border: 1px solid var(--dark-grey);
  //   border-right-width: 0px;
  //   /*   border: 2px solid var(--light-grey);
  //   border-top: 1px solid var(--light-grey); */
  //   /* margin: 1px; */
  //   /* padding-left: 1px; */
  //   /* padding-right: 1px; */
  //   margin-top: 0px;

  //   /* box-sizing: border-box; */
  //   box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.125);
  //   /* border-top: 0px; */
  //   /* border-radius: 5px; */
  //   border-bottom-left-radius: 10px;
  //   /* border-bottom-right-radius: 10px; */
  // }

  // .drop_down {
  //   cursor: pointer;
  //   display: none;
  //   position: fixed;

  //   z-index: 99;
  //   max-height: 300px;
  //   overflow: auto;
  //   /* overflow: hidden; */
  // }
  // .close-select.focus {
  //   display: inline-block;
  // }
  // .close-select {
  //   z-index: 98;
  //   height: 20000vh !important;
  //   width: 20000vw !important;
  //   left: -10000vw;
  //   top: -10000vh;
  //   position: fixed;
  //   display: none;
  // }
  // .select {
  //   /* margin-right: 5px; */
  //   margin-left: 5px;
  //   box-sizing: border-box;
  // }

  // .drop_down > * {
  //   height: inherit;
  //   padding-right: 5px;
  //   padding-left: 5px;
  // }

  // .drop_down > *:first-child {
  //   background: var(--light-grey) !important;
  // }

  // .drop_down.focus > *:hover {
  //   /* background-color: white; */
  //   /* background: var(--light-grey) !important; */
  //   border-right: 5px solid grey;
  //   background: white;
  //   /* text-decoration: underline; */
  // }

  // .select {
  //   line-height: 10pt;
  //   padding-top: 10px;
  //   padding-bottom: 10px;
  //   padding-right: 10px;
  // }

  const DropDown = () => {
    return (
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
          <div onMouseUp={closeDropDown}>{getSelectedLabel()}</div>
          <For each={getRemainingOptions()}>
            {(option) => (
              <div onMouseUp={() => selectValue(option.value)}>
                {option.label}
              </div>
            )}
          </For>
        </div>
      </>
    );
  };

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
        {getSelectedLabel()}
      </div>
    </>
  );
}

export default Select;
