import {
  Button,
  LongPanel,
  FlexRow,
  HeaderPanel,
  GridRow,
  Label,
  LabeledCheckbox,
  LabeledColorPicker,
  LabeledInput,
} from "./UI_Components";

import SVGStyling from "./SVGStyling";
import TextStyling from "./TextStyling";
import HighlightStyling from "./HighlightStyling";
import Swatches from "./Swatches";
import Hierarchy from "./Hierarchy";

import { createEffect } from "solid-js";

import { useStore } from "../../Store";

const SidePanel = (props) => {
  const [
    state,
    {
      toggleTypeManager,
      toggleMaskedStyling,
      toggleModeViewport,
      createNewCard,
      isTypeSelected,
      changeInstructionText,
      revertStateChange,
      getSelectedElement,
      isSelectedElementOfType,
      getSelectedSwatches,
      getSelectedType,
      getStyles,
      setSVGStyle,
      setCardDimension,
      getLocalElement,
      setBackground,
      setStyle,
      getTextStyles,
      setType,
    },
  ] = useStore();

  createEffect(() =>
    setTimeout(() => {
      console.log(getLocalElement({ id: "instruction" }));
    }, 1000)
  );

  return (
    <LongPanel className="right_panel">
      <FlexRow
        style={{
          "padding-bottom": "0px",
          "justify-content": "flex-end",
          height: "25px",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            flex: 1,
            "text-align": "left",
            "margin-left": "6px",
            "align-self": "center",
          }}
        >
          🃏 card editor for <i>{state.card_id}</i>
        </span>
        <Button onClick={toggleTypeManager}>manage types</Button>
        <Button>overview</Button>
        <Button onClick={createNewCard}>new card</Button>
        <Button onClick={props.processDeck}>process deck</Button>
        <Button onClick={props.saveDeck}>save deck</Button>
      </FlexRow>
      <LongPanel
        style={{
          "flex-direction": "row",
          overflow: "hidden",
          "margin-top": "6px",
          height: "100%",
        }}
      >
        <LongPanel style={{ width: "300px", overflow: "auto" }}>
          <HeaderPanel label="Card Type" visible={true}>
            <GridRow
              style={{
                "padding-top": "10px",
              }}
            >
              <Label>type</Label>
              <GridRow
                style={{
                  "grid-column": "span 3",
                  "grid-template-columns": "repeat(3, 1fr)",
                  "row-gap": "6px",
                  padding: "0px",
                }}
              >
                <For each={Object.keys(state.design.types)}>
                  {(type) => (
                    <Button
                      className={isTypeSelected(type) ? "focus" : ""}
                      style={{ flex: 1 }}
                      onClick={() => setType(type)}
                    >
                      {type}
                    </Button>
                  )}
                </For>
              </GridRow>
            </GridRow>
            <Show when={state.viewport.type !== "back"}>
              <GridRow>
                <Label>modes</Label>
                <LabeledCheckbox
                  label="choice "
                  checked={state.viewport.modes.choice}
                  onClick={() => toggleModeViewport("choice")}
                  style={{
                    "padding-top": "0px",
                    "padding-bottom": "0px",
                  }}
                ></LabeledCheckbox>
                <LabeledCheckbox
                  label="timed"
                  checked={state.viewport.modes.timed}
                  onClick={() => toggleModeViewport("timed")}
                  style={{
                    "padding-top": "0px",
                    "padding-bottom": "0px",
                  }}
                ></LabeledCheckbox>
              </GridRow>
              <GridRow style={{ "margin-bottom": "6px" }}>
                <Label style={{ "grid-column": "span 1" }}>instruction</Label>

                <Button
                  onClick={() => changeInstructionText()}
                  style={{ "grid-column": "span 2" }}
                >
                  random instruction
                </Button>
                <Button
                  onClick={() => revertStateChange()}
                  style={{ "grid-column": "span 1" }}
                >
                  ctrl+z
                </Button>
              </GridRow>
            </Show>
          </HeaderPanel>
          <Swatches></Swatches>

          <Show when={isSelectedElementOfType("svg")}>
            <SVGStyling
              header="Custom Text Styling"
              styles={getSelectedElement().styles}
              swatches={getSelectedSwatches(state.viewport.masked_styling)}
              setSVGStyle={setSVGStyle}
              masked_styling={state.viewport.masked_styling}
              toggleMaskedStyling={(e) => toggleMaskedStyling(e)}
              hide_modes={state.viewport.type === "back"}
            ></SVGStyling>
          </Show>
          <Show
            when={getSelectedType() && getLocalElement({ id: "instruction" })}
          >
            <TextStyling
              header="Instruction Styling"
              styles={getStyles({ id: "instruction" })}
              swatches={getSelectedSwatches(state.viewport.masked_styling)}
              onChange={(type, value) =>
                setStyle({ id: "instruction", type, value })
              }
              masked_styling={state.viewport.masked_styling}
              toggleMaskedStyling={(e) => toggleMaskedStyling(e)}
              visible={true}
              hide_modes={state.viewport.type === "back"}
            ></TextStyling>
            <HighlightStyling
              styles={getStyles({ id: "instruction", highlight: true })}
              swatches={getSelectedSwatches(state.viewport.masked_styling)}
              // onChange={(type, value) => setHighlightStyle({ type, value })}
              onChange={(type, value) =>
                setStyle({
                  id: "instruction",
                  type,
                  value,
                  highlight: true,
                })
              }
              masked_styling={state.viewport.masked_styling}
              toggleMaskedStyling={(e) => toggleMaskedStyling(e)}
              visible={true}
              hide_modes={state.viewport.type === "back"}
            ></HighlightStyling>
            <TextStyling
              header="Countdown Styling"
              styles={getStyles({ id: "countdown" })}
              swatches={getSelectedSwatches(state.viewport.masked_styling)}
              onChange={(type, value) =>
                setStyle({
                  id: "countdown",
                  type,
                  value,
                })
              }
              masked_styling={state.viewport.masked_styling}
              toggleMaskedStyling={(e) => toggleMaskedStyling(e)}
              visible={false}
              hide_modes={state.viewport.type === "back"}
            ></TextStyling>
          </Show>

          <Show when={isSelectedElementOfType("text")}>
            <TextStyling
              header="Custom Text Styling"
              styles={getSelectedElement().styles}
              swatches={getSelectedSwatches(state.viewport.masked_styling)}
              onChange={(type, value) =>
                setStyle({
                  index: state.viewport.selected_element_index,
                  type,
                  value,
                })
              }
              hide_modes={state.viewport.type === "back"}
            ></TextStyling>
          </Show>

          <HeaderPanel label="Card Styles" visible={false}>
            <FlexRow>
              <LabeledColorPicker
                label="background"
                value={state.design.background}
                onChange={setBackground}
                swatches={getSelectedSwatches()}
              ></LabeledColorPicker>

              <LabeledInput
                label="ratio"
                value={parseInt(state.design.card_dimensions.width)}
                onChange={(value) => setCardDimension("width", value)}
              ></LabeledInput>
            </FlexRow>
          </HeaderPanel>
        </LongPanel>
        <LongPanel
          style={{
            width: "300px",
            overflow: "auto",
            "border-left": "1px solid var(--light)",
          }}
        >
          <Hierarchy></Hierarchy>
        </LongPanel>
      </LongPanel>
    </LongPanel>
  );
};
export default SidePanel;
