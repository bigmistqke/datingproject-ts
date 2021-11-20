import { onMount, For, Index } from "solid-js";
import { RowContainer, Button } from "./UI_Components";
import { styled } from "solid-styled-components";

import {
  HeaderPanel,
  HeaderCategory,
  LabeledInput,
  LabeledSelect,
  LabeledColor,
} from "./UI_Components";

import isFalse from "../../helpers/isFalse";

const SVGStyles = (props) => {
  onMount(() => console.log("props.styles", props.styles, props.swatches));

  return (
    <>
      <HeaderPanel
        label="SVG Styles"
        visible={true}
        extra={
          <Button onClick={props.toggleMaskedStyling}>
            {props.masked_styling ? "timed" : "default"}
          </Button>
        }
      >
        <Index each={Object.entries(props.styles)}>
          {(style_entry, index) => {
            const [key, style] = style_entry();
            return (
              <RowContainer>
                <label>{index()}</label>
                <LabeledColor
                  label="Fill"
                  value={style.fill}
                  style={{ flex: 1 }}
                  swatches={props.swatches}
                  onChange={(value) =>
                    props.setSVGStyle({
                      key,
                      type: "fill",
                      value,
                      masked: props.masked,
                    })
                  }
                  draggable={true}
                  onDragEnter={(e) => {}}
                  onDragOver={(e) => e.preventDefault()}
                ></LabeledColor>
                <LabeledColor
                  draggable={true}
                  label="Stroke-Color"
                  value={style.stroke}
                  style={{ flex: 1 }}
                  swatches={props.swatches}
                  onChange={(value) =>
                    props.setSVGStyle({ key, type: "stroke", value })
                  }
                  draggable={true}
                ></LabeledColor>
                <LabeledInput
                  label="Stroke-Width"
                  value={style["stroke-width"] || 0}
                  style={{ flex: 1 }}
                  onChange={(value) =>
                    props.setSVGStyle({ key, type: "stroke-width", value })
                  }
                ></LabeledInput>
              </RowContainer>
            );
          }}
        </Index>
      </HeaderPanel>
    </>
  );
};

export default SVGStyles;
