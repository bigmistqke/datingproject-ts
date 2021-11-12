import Color from "./Color";

import { createSignal, createEffect, createMemo, onMount } from "solid-js";

import { styled } from "solid-styled-components";
import isColor from "../../helpers/isColor";
import isFalse from "../../helpers/isFalse";

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
        {props.data.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </Select>
    </GridRow>
  );
};

const LabeledColor = (props) => {
  let swatch_ref;

  const [getLastValue, setLastValue] = createSignal();

  const onDrop = (e) => {
    e.preventDefault();

    // props.changeColor(e);
    setLastValue(false);
  };

  const onDragEnter = (e) => {
    setLastValue(props.value);
    if (props.onDragEnter) props.onDragEnter(e);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let swatch_index = parseInt(e.dataTransfer.getData("swatch_index"));
    if (swatch_index === props.value) return;
    if (!swatch_index && swatch_index !== 0) return;
    props.onChange(swatch_index);
  };

  const revertColor = (e) => {
    e.preventDefault();

    // if (e.target === swatch_ref) return;
    if (isFalse(getLastValue())) return;
    props.onChange(getLastValue());
  };

  const getColor = createMemo(() => {
    if (props.value === "none" || isFalse(props.value)) return "#FFFFFF";
    if (isColor(props.value)) return props.value;
    return props.swatches[props.value];
  });

  return (
    <FlexRow>
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
        onMouseDown={props.onMouseDown ? props.onMouseDown : null}
      ></Color>
    </FlexRow>
  );
};

const LabeledColorPicker = (props) => {
  let input;

  const onDrop = (e) => {
    e.stopPropagation();

    let swatch_index = parseInt(e.dataTransfer.getData("swatch_index"));

    if (props.swatches[swatch_index] === props.value) return;

    props.onChange(props.swatches[swatch_index]);
  };

  const onInput = (e) => props.onChange(e.target.value);

  return (
    <>
      <input
        ref={input}
        type="color"
        value={props.value}
        style={{ display: "none" }}
        onInput={onInput}
      ></input>
      <FlexRow>
        <Label className="main">{props.label} </Label>
        <Color
          style={{ background: props.value }}
          onDragOver={onDrop}
          onDrop={onDrop}
          onMouseDown={() => input.click()}
        ></Color>
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
    <div style={{ flex: 1 }}>
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
  LabeledInput,
  HeaderCategory,
  HeaderPanel,
  HeaderContainer,
  LabeledSelect,
  LabeledColor,
  LabeledColorPicker,
  RowContainer,
  ColumnContainer,
  FlexRow,
  FlexColumn,
  Label,
  Button,
  GridRow,
  FullScreen,
  Overlay,
  Span,
};
