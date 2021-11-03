import "./Select.css";
import { createSignal, For, createMemo, createEffect } from "solid-js";

function Select(props) {
  let [getFocus, setFocus] = createSignal(false);
  let select_dom;
  let drop_down_dom;

  const remainingOptions = createMemo(() => {
    let remaining_options = props.options.filter((option) => {
      console.log(option.value, props.value, option.value != props.value);
      return option.value !== props.value;
    });

    console.log(
      "remainingOptions",
      props.options,
      remaining_options,
      props.value
    );
    return remaining_options;
  }, [props.options, props.value]);

  const closeDropDown = () => setFocus(false);

  const dropDown = (e) => {
    e.stopPropagation();
    setFocus(true);

    console.log(
      "props.options",
      props.options,
      props.value,
      remainingOptions()
    );

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

  createEffect(() => {
    console.log(
      "props.options",
      props.options,
      props.options.find((option) => option.value === props.value)
    );
  }, [props.options, props.value]);

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
                console.log("remaining options are : ", option);
                return (
                  <div
                    onMouseUp={() => {
                      selectValue(option);
                    }}
                  >
                    {option.label}
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
        {props.options.find((option) => option.value === props.value).label}
      </div>
    </>
  );
}

export default Select;
