import isColor from '../../helpers/isColor';
import styled from 'styled-components/native';

import { useStore } from '../../Store';
import React, { useMemo, useEffect } from "react";
import { SvgXml } from 'react-native-svg';

const SVGElement = props => {
  const [state, { getStyles }] = useStore();

  const getStyleString = ({ svg, styles }) => {
    let new_style_string = '';

    Object.entries(styles).forEach(([name, style]) => {
      let string = `${props.masked ? '.masked ' : ''}.${name} {\n`;
      Object.entries(style).forEach((entry) => {
        console.log(entry);
        /*   if (key === 'fill' || key === 'stroke') {
            if (value === 'none') {
              string += `${key}:transparent !important; `;
            } else {
              string += `${key}:${isColor(value) ? value : props.swatches[value]
                }  !important;\n`;
            }
          } else {
            string += `${key}:${value}; `;
          } */
      });
      string += '}\n';
      new_style_string += string;
    });

    return new_style_string;
  };

  const SVGContainer = styled.View`
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

  let styles = useMemo(() => getStyles({
    index: props.index,
    type: props.instruction.type,
  }), [])

  /*   useEffect(() => {
      console.log("props.element.svg", props.element.svg)
    }, [props.element.svg]) */

  const processed_svg = useMemo(() => {
    // let styles = { test: { fill: "#000000", stroke: "#ffffff" } }
    console.log("styles", styles);
    let svg = props.element.svg;
    Object.entries(styles).forEach(([class_name, class_style]) => {
      const style_string = Object.entries(class_style).map(([key, value]) => {
        if (key === 'fill' || key === 'stroke') {
          if (value === 'none') {
            return `${key}: transparent`;
          } else {

            if (isColor(value)) {
              return `${key}: ${value}`;
            } else {
              return `${key}: ${props.swatches[value]}`;
            }
          }
        } else {
          return `${key}: ${value}`;
        }
      }).join("; ") + ";";
      const search_string = `class="${class_name}"`;
      const replace_string = `style="${style_string}"`;
      console.log(search_string, replace_string);
      svg = svg.replace(new RegExp(search_string, 'g'), replace_string)
    })
    console.log(svg);
    /* styles.forEach((style)=>{
    }) */
    return svg;
  }, [props.element])

  return (
    <>
      {/* <style>
        {style}
      </style> */}
      <SvgXml
        width="100%"
        height="100%"
        // ref={svg_ref}
        /*  style={{
           width: '100%',
           height: '100%',
         }} */
        xml={processed_svg}
      // classList={{ masked: props.masked }}
      ></SvgXml>
    </>
  );
};

export default SVGElement;
