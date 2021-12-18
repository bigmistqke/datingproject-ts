import { Image } from "react-native";
import React, { useMemo, useEffect } from "react";
const SVGElement = props => {
  return <Image
    style={{ width: "100%", height: "100%" }}
    source={{ uri: `file://${props.element.url[props.masked ? "masked" : "normal"]}` }}
  />
}
export default SVGElement;
