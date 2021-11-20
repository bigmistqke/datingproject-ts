import ResizeHandles from "../viewport/ResizeHandles";
import CardElement from "./CardElement";
import CardMask from "./CardMask";
import { For, Show, createEffect } from "solid-js";

import { useStore } from "../../Store";

const CardComposition = (props) => {
  const [state, { resizeElement }] = useStore();

  const getDimensions = (element) => {
    if (element.global) {
      return props.globals[element.id].dimensions;
    } else {
      return element.dimensions;
    }
  };

  const getPosition = (element) => {
    if (element.global) {
      return props.globals[element.id].position;
    } else {
      return element.position;
    }
  };

  const isElementVisible = (element) => {
    let modes;
    if (element.global) {
      modes = props.deck.globals[element.id].modes;
    } else {
      modes = element.modes;
    }

    for (let [mode_type, activated] of Object.entries(props.modes)) {
      if (modes[mode_type] !== 1 && modes[mode_type] !== (activated ? 2 : 0)) {
        return false;
      }
    }
    return true;
  };

  createEffect(() => console.log("ELEMENTS", props.elements));

  return (
    <For each={props.elements}>
      {(element, index) => (
        <Show when={isElementVisible(element)}>
          <CardElement
            index={index()}
            element={element}
            type={element.type}
            locked={element.locked}
            position={getPosition(element)}
            dimensions={getDimensions(element)}
            styles={props.getStyles(element)}
            highlight_styles={props.getStyles({
              index: index(),
              highlight: true,
            })}
            card_dimensions={props.card_dimensions}
            card_size={props.card_size}
            swatches={props.swatches}
            timed={props.timed}
            masked={props.masked}
          >
            <Show when={index() === props.selected_element_index}>
              <ResizeHandles
                locked={element.locked}
                element={element}
                position={getPosition(element)}
                dimensions={getDimensions(element)}
                card_size={props.card_size}
                onResize={({ position, dimensions }) =>
                  resizeElement({ index: index(), position, dimensions })
                }
                archiveStateChanges={props.archiveStateChanges}
                keep_ratio={element.type === "svg"}
              ></ResizeHandles>
            </Show>
          </CardElement>
        </Show>
      )}
    </For>
  );
};

const CardCompositor = (props) => {
  return (
    <>
      <CardComposition {...props}></CardComposition>
      <Show when={props.timed}>
        <CardMask percentage={props.masked_percentage}>
          <CardComposition masked={true} {...props}></CardComposition>
        </CardMask>
      </Show>
    </>
  );
};

export default CardCompositor;
