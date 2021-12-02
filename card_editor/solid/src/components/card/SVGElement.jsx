import isColor from "../../helpers/isColor";
import { styled } from "solid-styled-components";
import { createEffect } from "solid-js";

import { useStore } from "../../Store";

const SVGElement = (props) => {
  const [state, { getStyles }] = useStore();

  const getStyleString = ({ svg, styles }) => {
    let new_style_string = "";

    Object.entries(styles).forEach(([name, style]) => {
      let string = `${props.masked ? ".masked " : ""}.${name} {\n`;
      Object.entries(style).forEach(([key, value]) => {
        if (key === "fill" || key === "stroke") {
          if (value === "none") {
            string += `${key}:transparent !important; `;
          } else {
            string += `${key}:${
              isColor(value) ? value : props.swatches[value]
            }  !important;\n`;
          }
        } else {
          string += `${key}:${value}; `;
        }
      });
      string += "}\n";
      new_style_string += string;
    });

    return new_style_string;
  };

  const SVGContainer = styled("div")`
    width: 100%;
    height: 100%;
    pointer-events: none;
    & > svg {
      pointer-events: none !important;
    }
    & > svg * {
      pointer-events: auto !important;
    }
  `;

  // createEffect(() => console.log(props.element.svg));

  return (
    <>
      <style>
        {getStyleString({
          svg: props.svg,
          styles: getStyles({
            index: props.index,
            type: props.instruction.type,
          }),
        })}
      </style>
      <SVGContainer
        width="100%"
        height="100%"
        // ref={svg_ref}
        style={{
          width: "100%",
          height: "100%",
        }}
        innerHTML={props.element.svg}
        classList={{ masked: props.masked }}
      ></SVGContainer>
    </>
  );
};

export default SVGElement;
