import {
  HeaderPanel,
  HeaderCategory,
  LabeledInput,
  LabeledSelect,
  LabeledColor,
  Button,
  FlexColumn,
  FlexRow,
} from "./UI_Components";

import { onMount, Show } from "solid-js";

const HighlightStyling = (props) => {
  return (
    <>
      <HeaderPanel
        label="Highlight Styling"
        extra={
          <Show when={!props.hide_modes}>
            <Button onClick={props.toggleMaskedStyling}>
              {props.masked_styling ? "timed" : "default"}
            </Button>
          </Show>
        }
        visible={props.visible}
      >
        <FlexRow>
          <FlexColumn>
            <HeaderCategory label="Font Styles" visible={true}>
              <LabeledSelect
                label="Family"
                data={["arial", "arial_rounded", "times"]}
                value={props.styles.family}
                onChange={(value) => props.onChange("family", value)}
              ></LabeledSelect>
              <LabeledColor
                label="Color"
                swatches={props.swatches}
                value={props.styles.color}
                onChange={(value) => props.onChange("color", value)}
              ></LabeledColor>
            </HeaderCategory>
            <HeaderCategory label="Box" visible={true}>
              <LabeledInput
                label="Radius"
                value={parseInt(props.styles.borderRadius)}
                onChange={(value) => props.onChange("borderRadius", value)}
              ></LabeledInput>
              <LabeledColor
                label="Background"
                swatches={props.swatches}
                value={props.styles.background}
                onChange={(value) => props.onChange("background", value)}
              ></LabeledColor>
            </HeaderCategory>
          </FlexColumn>
          <FlexColumn>
            <HeaderCategory label="Alignment">
              <LabeledSelect
                label="Horizontal"
                data={["left", "center", "right"]}
                value={props.styles.alignmentHorizontal}
                onChange={(value) =>
                  props.onChange("alignmentHorizontal", value)
                }
              ></LabeledSelect>
            </HeaderCategory>

            <HeaderCategory label="Margin">
              <LabeledInput
                style={{ flex: "0 auto" }}
                label="horizontal"
                value={parseInt(props.styles.marginHorizontal)}
                onChange={(value) => props.onChange("marginHorizontal", value)}
              ></LabeledInput>
              <LabeledInput
                label="vertical"
                value={parseInt(props.styles.marginVertical)}
                onChange={(value) => props.onChange("marginVertical", value)}
              ></LabeledInput>
            </HeaderCategory>
            <HeaderCategory label="Padding">
              <LabeledInput
                style={{ flex: "0 auto" }}
                label="horizontal"
                value={parseInt(props.styles.paddingHorizontal)}
                onChange={(value) => props.onChange("paddingHorizontal", value)}
              ></LabeledInput>
              <LabeledInput
                style={{ flex: "0 auto" }}
                label="vertical"
                value={parseInt(props.styles.paddingVertical)}
                onChange={(value) => props.onChange("paddingVertical", value)}
              ></LabeledInput>
            </HeaderCategory>

            <HeaderCategory label="Border">
              <LabeledInput
                style={{ flex: "0 auto" }}
                label="width"
                value={parseInt(props.styles.borderWidth)}
                onChange={(value) => props.onChange("borderWidth", value)}
              ></LabeledInput>
              <LabeledColor
                style={{ flex: "0 auto" }}
                label="color"
                swatches={props.swatches}
                value={props.styles.borderColor || 0}
                onChange={(value) => props.onChange("borderColor", value)}
              ></LabeledColor>
            </HeaderCategory>

            {/* <HeaderCategory label="Box Shadow">
                <LabeledInput
                  label="left"
                  value={props.styles.boxShadowLeft || 0}
                  onChange={(value) => props.onChange("boxShadowLeft", value)}
                ></LabeledInput>
                <LabeledInput
                  label="top"
                  value={props.styles.boxShadowTop || 0}
                  onChange={(value) => props.onChange("boxShadowTop", value)}
                ></LabeledInput>
                <LabeledInput
                  label="blur"
                  value={props.styles.boxShadowBlur || 0}
                  onChange={(value) => props.onChange("boxShadowBlur", value)}
                ></LabeledInput>
                LabeledColor
                  label="color"
                  type="color"
                  value={
                    props.swatches[props.styles.boxShadowColor] ||
                    props.swatches[0]
                  }
                  onChange={(value) => props.onChange("textShadowColor", value)}
                ></LabeledColor>
              </HeaderCategory>
                */}

            <HeaderCategory label="Text Shadow">
              <LabeledInput
                label="left"
                value={props.styles.textShadowLeft || 0}
                onChange={(value) => props.onChange("textShadowLeft", value)}
              ></LabeledInput>
              <LabeledInput
                label="top"
                value={props.styles.textShadowTop || 0}
                onChange={(value) => props.onChange("textShadowTop", value)}
              ></LabeledInput>
              <LabeledInput
                label="blur"
                value={props.styles.textShadowBlur || 0}
                onChange={(value) => props.onChange("textShadowBlur", value)}
              ></LabeledInput>
              <LabeledColor
                label="color"
                swatches={props.swatches}
                value={props.styles.textShadowColor || 0}
                onChange={(value) => props.onChange("textShadowColor", value)}
              ></LabeledColor>
            </HeaderCategory>
          </FlexColumn>
        </FlexRow>
      </HeaderPanel>
    </>
  );
};
export default HighlightStyling;
