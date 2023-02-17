import { Image } from "react-native";
import React, { useMemo, useEffect } from "react";
import RNFS from "react-native-fs";
import { useStore } from "../../store/Store";

const base_url = RNFS.DocumentDirectoryPath + '/designs';
import FastImage from "react-native-fast-image"

const SVGElement = props => {
  const [state] = useStore();
  return <FastImage
    style={{ width: "100%", height: "100%" }}
    source={{ uri: `file://${base_url}/${props.element.id}_${props.masked ? "masked" : "normal"}.png?${state.game_start}` }}
  />
}
export default SVGElement;
