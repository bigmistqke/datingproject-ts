// import Color from "./Color";

import { createSignal, createEffect, createMemo, onMount } from "solid-js";
import { useStore } from "../../store/Store";

import { styled } from "solid-styled-components";
import isColor from "../../helpers/isColor";
import isFalse from "../../helpers/isFalse";

let dragged_color = undefined;

const Color = styled("div")`
  width: 16px;
  height: 16px;
  border: 1px solid grey;
  border-radius: 3px;
  &.small {
    width: 12px;
    height: 12px;
  }
`;

const LongPanel = styled("div")`
  bottom: 0px;
  right: 0px;
  background: white;
  text-align: left;
  z-index: 5;
  text-align: left;
  font-size: 8pt;
  overflow: hidden;
  flex-direction: column;
  border-left: 3px solid white;
  display: flex;
  & * {
    font-size: 8pt;
  }
`;

const Row = styled("div")`
  display: flex;
  flex: 1;
  line-height: 12pt;
  align-items: center;
  /* padding-right: 5px; */
  /* margin-bottom: 5px; */
  padding: 3px;
  padding-right: 9px;
  box-sizing: border-box;
`;

const FlexRow = styled("div")`
  display: flex;
  flex-direction: row;
  gap: 6px;
  padding: 3px;
  /* padding-right: 9px; */
  width: 100%;
  box-sizing: border-box;
  height: auto;
`;

const GridRow = styled("div")`
  display: grid;
  flex-direction: row;
  /* gap: 9px; */
  padding: 3px;
  /* padding-right: 9px; */
  width: 100%;
  box-sizing: border-box;
  height: auto;
  grid-template-columns: repeat(4, 25%);
  & > * {
  }
`;

const FlexColumn = styled("div")`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 6px;
  /* padding-right: px; */
  /* padding: 6px; */
  /* padding-right: 9px; */
  width: 100%;
  box-sizing: border-box;
  height: auto;
`;

const ColumnContainer = styled("div")`
  display: flex;
  line-height: 12pt;
  font-size: 16pt;
  padding: 3px;
  gap: 3px;
  flex-direction: column;
  box-sizing: border-box;

  &:not(:first-child) {
    border-bottom: 1px solid var(--light);
  }
  & label {
    margin-right: 3px;
  }
`;

const RowContainer = styled("div")`
  display: flex;
  line-height: 12pt;
  font-size: 16pt;
  padding: 3px;
  gap: 3px;
  padding-right: 3px;
  box-sizing: border-box;

  &:not(:last-child) {
    border-bottom: 1px solid var(--light);
  }
  & label {
    margin-right: 3px;
  }
`;

const Label = styled("label")`
  display: inline-block;
  flex: 1;
  height: 100%;
  color: var(--medium);
  margin-left: 3px;
  white-space: nowrap;
  align-self: center;
  line-height: 16px;
  font-size: 8pt;
`;

const H1 = styled("h1")`
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  background: var(--light);
  color: black;
  padding: 6px;
  padding-left: 6px;
  margin: 0px;
  display: flex;

  &:not(:first-child) {
    margin-top: 3px;
    margin-bottom: 3px;
  }
`;

const Title = styled("span")`
  flex: 1;
`;

const H2 = styled("h2")`
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  margin: 0px;
  /* margin-bottom: 5px; */
  padding: 3px;
  padding-left: 3px;
  padding-top: 3px;
`;

const Button = styled("button")`
  border: 0px solid white;
  border-radius: 5px;
  font-size: 6pt !important;
  align-self: center;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
  margin-right: 2px;
  padding-bottom: 2px;
  padding-top: 2px;
  background: var(--light);
  cursor: pointer;
  &:hover,
  &.focus {
    background: var(--button-focus);
    color: white;
  }
`;

const Span = styled("button")`
  border: 0px solid white;
  border-radius: 5px;
  font-size: 6pt !important;
  align-self: center;
  box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
  margin-right: 2px;
  padding-bottom: 2px;
  padding-top: 2px;
  background: var(--light);
`;

const Input = styled("input")`
  box-sizing: border-box;
  padding-right: 0px;
  padding-left: 6px;
  border-radius: 3px;
  flex: 0 55px;
  margin: 0px;
  width: 100%;
  border: none;
  background: var(--light);
  height: 16px;
  &[type="checkbox"] {
    flex: 0 10px !important;
    margin-right: 6px;
  }
`;

const Select = styled("select")`
  box-sizing: border-box;
  padding-right: 0px;
  padding-left: 3px;
  border-radius: 3px;
  flex: 0 55px;
  margin: 0px;
  width: 100%;
  border: none;
  height: 16px;
  background: var(--light);
`;

const FullScreen = styled("div")`
  width: 100%;
  height: 100%;
  position: fixed;
  z-index: 50;
`;
const Overlay = styled("div")`
  position: absolute;
  z-index: 50;
  background: white;
  border-radius: 12px;
  min-width: 75px;
  box-shadow: 0px 0px 50px lightgrey;
  overflow: hidden;
  font-size: 8pt;
  & > * {
    padding: 15px;
  }
`;

const LabeledSelect = (
  props /* { label, value, data, type = "number", onChange } */
) => {
  const handleChange = (event) => {
    props.onChange(event.target.value);
  };

  return (
    <GridRow
      style={{ "grid-template-columns": "repeat(2, 50%)", ...props.style }}
    >
      <Label>{props.label} </Label>
      <Select
        key={props.label}
        value={props.value}
        type={props.type}
        onChange={handleChange}
      >
        <For each={props.data}>
          {(value) => (
            <option value={typeof value === "string" ? value : value.value}>
              {typeof value === "string" ? value : value.label}
            </option>
          )}
        </For>
      </Select>
    </GridRow>
  );
};

const LabeledCheckbox = (props) => {
  return (
    <>
      <LabeledColor
        className="small"
        label={props.label}
        value={props.checked ? "var(--green)" : "var(--red)"}
        onClick={props.onClick}
        style={{
          "padding-top": "0px",
          "padding-bottom": "0px",
        }}
      ></LabeledColor>
    </>
  );
};

const LabeledColor = (props) => {
  let swatch_ref;

  const [getLastValue, setLastValue] = createSignal();

  const onDrop = (e) => {
    e.preventDefault();

    setLastValue(false);
  };

  const onDragEnter = (e) => {
    e.preventDefault();
    setLastValue(props.value);

    if (props.onDragEnter) props.onDragEnter(e);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    // e.stopPropagation();

    let swatch_index = dragged_color;

    console.log("this happens tooo??", e.dataTransfer.getData("text/plain"));

    if (swatch_index === props.value) return;

    if (!swatch_index && swatch_index !== 0) return;

    props.onChange(parseInt(swatch_index));
  };

  const revertColor = (e) => props.onChange(getLastValue());

  const getColor = createMemo(() => {
    if (props.value === "none" || isFalse(props.value)) return "#FFFFFF";
    if (typeof props.value === "number") {
      return props.swatches[props.value];
    } else {
      return props.value;
    }
  });

  return (
    <FlexRow style={{ ...props.style }}>
      <Label className="main">{props.label} </Label>
      <Color
        ref={swatch_ref}
        style={{
          background: getColor(),
        }}
        draggable={props.draggable}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={revertColor}
        onDrop={onDrop}
        onClick={props.onClick}
        onMouseDown={props.onMouseDown ? props.onMouseDown : null}
        className={props.className}
      ></Color>
    </FlexRow>
  );
};

const ColorPicker = (props) => {
  const [state, { archiveStateChanges }] = useStore();
  let input;

  let old_value;
  let last_time = performance.now();

  const onInput = (e) => {
    if (performance.now() - last_time < 1000 / 30) return;
    last_time = performance.now();
    props.onInput(e.target.value);
  };

  const onFocus = (e) => {
    old_value = JSON.parse(JSON.stringify(props.value));
  };

  const onChange = (e) => {
    let result = props.onInput(e.target.value);
    if (old_value !== e.target.value) {
      // archiveStateChanges([{ ...result, old_value }]);
    }
  };

  const onDragStart = (e) => {
    dragged_color = props.index;
    // e.dataTransfer.setData("text", props.index);
    // console.log("ONDRAGSTART ", e.dataTransfer.getData("text/plain"));
  };

  const onDrop = (e) => {};

  return (
    <>
      <input
        ref={input}
        type="color"
        value={props.value}
        style={{ display: "none" }}
        onInput={onInput}
        onChange={onChange}
        onClick={onFocus}
      ></input>
      <Color
        style={{ background: props.value }}
        onDragStart={onDragStart}
        onDrop={onDrop}
        draggable={props.draggable}
        onClick={() => {
          input.click();
          props.onClick();
        }}
      ></Color>
    </>
  );
};

const LabeledColorPicker = (props) => {
  return (
    <>
      <FlexRow>
        <Label className="main">{props.label} </Label>
        <ColorPicker
          value={props.value}
          onChange={props.onChange}
        ></ColorPicker>
      </FlexRow>
    </>
  );
};

const LabeledInput = (props) => {
  const handleChange = (event) => {
    let value;
    if (props.type === "number") {
      value = parseInt(event.target.value);
    } else if (props.type === "checkbox") {
      value = event.target.checked;
    } else {
      value = event.target.value;
    }
    props.onChange(value);
  };

  return (
    <GridRow
      style={{ "grid-template-columns": "repeat(2, 50%)", ...props.style }}
    >
      <Label className="main">{props.label} </Label>
      <Input
        key={props.label}
        checked={props.checked}
        value={props.value}
        type={props.type ? props.type : "number"}
        min={!props.type || props.type === "number" ? 0 : null}
        onChange={handleChange}
      ></Input>
    </GridRow>
  );
};

const HeaderCategory = (props /* { label, data, onChange, children } */) => {
  const [getMode, setMode] = createSignal(
    props.visible ? props.visible : false
  );

  const toggleMode = () => setMode(!getMode());
  return (
    <div>
      <H2 onClick={toggleMode}>{props.label}</H2>
      <div style={{ display: getMode() ? "" : "none" }}>{props.children}</div>
    </div>
  );
};

const HeaderPanel = (props) => {
  const [getMode, setMode] = createSignal(
    props.visible || props.always_visible
      ? props.visible || props.always_visible
      : false
  );

  const toggleMode = () => setMode(!getMode());

  return (
    <>
      <H1 onClick={!props.always_visible ? toggleMode : null}>
        <Title>{props.label}</Title>
        {props.extra}
      </H1>
      <div style={{ display: getMode() ? "" : "none" }}>{props.children}</div>
      {/* <Show when={getMode()}>{props.children}</Show> */}
    </>
  );
};

const HeaderContainer = (props) => {
  return (
    <>
      <H1>{props.label}</H1>
      {props.children}
    </>
  );
};

export {
  Color,
  Label,
  Button,
  Span,
  ColorPicker,
  Overlay,
  FullScreen,
  FlexRow,
  FlexColumn,
  GridRow,
  RowContainer,
  ColumnContainer,
  HeaderCategory,
  HeaderPanel,
  HeaderContainer,
  LabeledCheckbox,
  LabeledInput,
  LabeledSelect,
  LabeledColor,
  LabeledColorPicker,
  LongPanel,
};
