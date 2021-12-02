import Draggable from "../viewport/Draggable";
import { Show, createEffect, onMount, createSignal } from "solid-js";
import { styled } from "solid-styled-components";

import SVGElement from "./SVGElement";
import InstructionElement from "./InstructionElement";
import CountdownElement from "./CountdownElement";

import ResizeHandles from "../viewport/ResizeHandles";

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
      /* getPosition,
      getDimensions, */
    },
  ] = useStore();

  const [isSelected, setIsSelected] = createSignal(false);
  const [position, setPosition] = createSignal({ x: null, y: null });
  const [dimensions, setDimensions] = createSignal({
    width: null,
    height: null,
  });

  const getDimensions = ({ element, type }) => {
    return element.global
      ? state.design.globals[element.id].dimensions
      : element.dimensions;
  };

  const getPosition = ({ element, type }) => {
    return element.global
      ? state.design.globals[element.id].positions
      : element.positions;
  };

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
    height: 100%;
    width: 100%;
    & > * {
      pointer-events: all;
    }
  `;

  createEffect(() => {
    setIsSelected(state.viewport.selected_element_index === props.index);
  });

  createEffect(() => {
    setPosition(
      props.element.global
        ? state.design.globals[props.element.id].position
        : props.element.position
    );
  });
  createEffect(() =>
    setDimensions(
      props.element.global
        ? state.design.globals[props.element.id].dimensions
        : props.element.dimensions
    )
  );

  return (
    <Draggable
      position={{ ...position() }}
      style={
        dimensions
          ? {
              width: dimensions().width + "%",
              height: dimensions().height + "%",
            }
          : null
      }
      locked={props.locked}
      onPointerDown={onPointerDown}
      onTranslate={onTranslate}
      onContextMenu={openContext}
    >
      <Element>
        <Show when={isSelected()}>
          <ResizeHandles
            {...props}
            onResize={({ position, dimensions }) =>
              resizeElement({ index: index(), position, dimensions })
            }
            keep_ratio={props.type === "svg"}
          ></ResizeHandles>
        </Show>
        <Show when={props.type === "countdown"}>
          <CountdownElement {...props}></CountdownElement>
        </Show>
        <Show when={props.type === "instruction"}>
          <InstructionElement {...props}></InstructionElement>
        </Show>
        <Show when={props.type === "svg"}>
          <SVGElement {...props}></SVGElement>
        </Show>
      </Element>
    </Draggable>
  );
};

export default CardElement;
