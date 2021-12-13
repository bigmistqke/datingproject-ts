import { Image } from "react-native";
import React, { useMemo } from "react";
const SVGElement = props => {
  /* return <Image
    style={{ width: "100%", height: "100%" }}
    source={{
      uri: 'https://reactnative.dev/img/tiny_logo.png',
    }}
  /> */
  return props.element.svg[props.masked ? "masked" : "normal"]
  // return props.element.svg[props.masked ? "masked" : "normal"]

}
export default SVGElement;
