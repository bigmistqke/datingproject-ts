import ResizeHandles from "../viewport/ResizeHandles";
import CardElement from "./CardElement";
import { For, Show, createEffect } from "solid-js";

const CardComposition = (props) => {
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

  const onTranslate = (index, delta) => {
    props.translateElement({ index, delta });
  };

  /*   const onResize = ({ position, dimensions, index }) => {
    props.resizeElement({
      index: index(),
      position,
      dimensions,
    });
  }; */

  return (
    <For each={props.elements}>
      {(element, index) => (
        <Show when={props.elementIsVisible(element)}>
          <CardElement
            element={element}
            type={element.type}
            position={getPosition(element)}
            locked={element.locked}
            dimensions={getDimensions(element)}
            styles={props.getStyles(element)}
            highlight_styles={props.getStyles({
              index: index(),
              highlight: true,
            })}
            card_dimensions={props.card_dimensions}
            card_size={props.card_size}
            guides={props.guides}
            shouldSnap={props.shouldSnap}
            shiftPressed={props.isShiftPressed}
            altPressed={props.isAltPressed}
            zIndex={index}
            swatches={props.swatches}
            timed={props.timed}
            onTranslate={(delta) => onTranslate(index(), delta)}
            onPointerDown={() => {
              props.selectElement(index());
            }}
            // onPointerUp={}
            onResize={({ position, dimensions }) => {
              props.resizeElement({ index: index(), position, dimensions });
            }}
            openPrompt={props.openPrompt}
            removeElement={() => props.removeElement(index())}
            masked={props.masked}
          >
            <Show when={index() === props.selected_element_index}>
              <ResizeHandles
                locked={element.locked}
                keep_ratio={element.type === "svg"}
                element={element}
                position={getPosition(element)}
                dimensions={getDimensions(element)}
                guides={props.guides}
                card_dim={props.deck.card_dimensions}
                shiftPressed={props.isShiftPressed}
                altPressed={props.isAltPressed}
                card_size={props.card_size}
                // onResize={onResize({ index: index(), position, dimension })}
                onResize={({ position, dimensions }) =>
                  props.resizeElement({ index: index(), position, dimensions })
                }
              ></ResizeHandles>
            </Show>
          </CardElement>
        </Show>
      )}
    </For>
  );
};

export default CardComposition;
