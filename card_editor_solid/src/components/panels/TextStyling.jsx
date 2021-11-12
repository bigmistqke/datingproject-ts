import {
  HeaderPanel,
  HeaderCategory,
  LabeledInput,
  LabeledSelect,
  LabeledColor,
  Button,
  GridRow,
} from "./UI_Components";

import { Show } from "solid-js";

const TextStyles = (props) => {
  return (
    <>
      <HeaderPanel
        label={props.header}
        extra={
          <Show when={!props.no_modes}>
            <Button onClick={props.toggleMaskedStyling}>
              {props.masked_styling ? "timed" : "default"}
            </Button>
          </Show>
        }
        visible={props.visible}
      >
        <GridRow style={{ "grid-template-columns": "repeat(2, 50%)" }}>
          <div style={{ flex: 1 }}>
            <HeaderCategory label="Font Styles" visible={true}>
              <LabeledSelect
                label="Family"
                data={["arial", "times", "custom"]}
                value={props.styles.family}
                onChange={(value) => props.onChange("family", value)}
              ></LabeledSelect>
              <LabeledInput
                label="Size"
                value={props.styles.size}
                onChange={(value) => props.onChange("size", value)}
              ></LabeledInput>
              <LabeledInput
                label="Line Height"
                value={props.styles.lineHeight}
                onChange={(value) => props.onChange("lineHeight", value)}
              ></LabeledInput>
              <LabeledInput
                label="Spacing"
                value={props.styles.spacing}
                min={-50}
                onChange={(value) => props.onChange("spacing", value)}
              ></LabeledInput>
              <LabeledColor
                label="Color"
                type="color"
                swatches={props.swatches}
                value={props.styles.color}
                onChange={(value) => props.onChange("color", value)}
              ></LabeledColor>
            </HeaderCategory>
          </div>
          <div style={{ flex: 1 }}>
            <HeaderCategory label="Alignment">
              <LabeledSelect
                label="Horizontal"
                data={["flex-start", "center", "flex-end"]}
                value={props.styles.alignmentHorizontal}
                onChange={(value) =>
                  props.onChange("alignmentHorizontal", value)
                }
              ></LabeledSelect>
              <LabeledSelect
                label="Vertical"
                data={["flex-start", "center", "flex-end"]}
                value={props.styles.alignmentVertical}
                onChange={(value) => props.onChange("alignmentVertical", value)}
              ></LabeledSelect>
            </HeaderCategory>

            <HeaderCategory label="Text Shadow">
              <LabeledInput
                label="left"
                value={props.styles.shadowLeft}
                onChange={(value) => props.onChange("shadowLeft", value)}
              ></LabeledInput>
              <LabeledInput
                label="top"
                value={props.styles.shadowTop}
                onChange={(value) => props.onChange("shadowTop", value)}
              ></LabeledInput>
              <LabeledInput
                label="blur"
                value={props.styles.shadowBlur}
                onChange={(value) => props.onChange("shadowBlur", value)}
              ></LabeledInput>
              <LabeledColor
                label="color"
                type="color"
                swatches={props.swatches}
                value={props.styles.shadowColor || 0}
                onChange={(value) => props.onChange("shadowColor", value)}
              ></LabeledColor>
            </HeaderCategory>
          </div>
        </GridRow>
      </HeaderPanel>
    </>
  );
};

export default TextStyles;
