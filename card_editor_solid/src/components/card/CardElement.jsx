import Draggable from "../viewport/Draggable";
import { Show } from "solid-js";
import { styled } from "solid-styled-components";

import SVGElement from "./SVGElement";
import TextElement from "./TextElement";

import { useStore } from "../../Store";

const CardElement = (props) => {
  const [
    state,
    {
      openPrompt,
      translateElement,
      resizeElement,
      removeElement,
      archiveStateChanges,
      setSelectedElementIndex,
    },
  ] = useStore();
  const openContext = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await openPrompt({
      type: "options",
      position: { x: e.clientX, y: e.clientY },
      data: {
        options: ["delete", "fill", "fill horizontally", "fill vertically"],
      },
    });

    if (!result) return;

    switch (result) {
      case "delete":
        removeElement();
        break;
      case "fill":
        archiveStateChanges(
          resizeElement({
            index: props.index,
            dimensions: { width: 100, height: 100 },
            position: { x: 0, y: 0 },
          })
        );
        break;
      case "fill horizontally":
        archiveStateChanges(
          resizeElement({
            index: props.index,
            dimensions: { width: 100, height: props.dimensions.height },
            position: { x: 0, y: props.position.y },
          })
        );
        break;
      case "fill vertically":
        archiveStateChanges(
          resizeElement({
            index: props.index,
            dimensions: { width: props.dimensions.width, height: 100 },
            position: { x: props.position.x, y: 0 },
          })
        );
        break;
    }
  };
  const onPointerDown = (e) => {
    if (e.button === 0) setSelectedElementIndex(props.index);
    e.stopPropagation();
  };

  const onTranslate = (delta) =>
    translateElement({ index: props.index, delta });

  const Element = styled("div")`
    pointer-events: none;
    & > * {
      pointer-events: all;
    }
  `;
  return (
    <Draggable
      position={{ ...props.position }}
      style={
        props.dimensions
          ? {
              width: props.dimensions.width + "%",
              height: props.dimensions.height + "%",
            }
          : null
      }
      locked={props.locked}
      onPointerDown={onPointerDown}
      onTranslate={onTranslate}
      onContextMenu={openContext}
    >
      <Element>
        {props.children}
        <Show when={props.type === "countdown" || props.type === "instruction"}>
          <TextElement
            styles={props.styles}
            highlight_styles={props.highlight_styles}
            card_size={props.card_size}
            swatches={props.swatches}
            content={props.fomatted_text}
          ></TextElement>
        </Show>
        <Show when={props.type === "svg"}>
          <SVGElement
            masked={props.masked}
            element={props.element}
            svg={props.element.svg}
            styles={props.element.styles}
            swatches={props.swatches}
            masked={props.masked}
          ></SVGElement>
        </Show>
      </Element>
    </Draggable>
  );
};

export default CardElement;
