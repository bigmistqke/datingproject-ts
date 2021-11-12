import ResizeHandles from "../viewport/ResizeHandles";
import CardElement from "./CardElement";
import { For, Show, createEffect } from "solid-js";

const CardComposition = (props) => {
  const getDimensions = (element) => {
    switch (element.type) {
      case "instruction":
        return props.instruction_dimensions;
      case "countdown":
        return props.countdown_dimensions;
      default:
        return element.dimensions;
    }
  };

  const getPosition = (element) => {
    switch (element.type) {
      case "instruction":
        return props.instruction_position;
      case "countdown":
        return props.countdown_position;
      default:
        return element.position;
    }
  };

  const onTranslate = (index, delta) => {
    switch (props.elements[index].type) {
      case "instruction":
        props.translateInstruction(delta);
        break;
      case "countdown":
        props.translateCountdown(delta);
        break;
      default:
        props.translateElement({ index, delta });
        break;
    }
  };

  const onResize = ({ position, dimensions, index }) => {
    switch (props.elements[index()].type) {
      case "instruction":
        props.resizeInstruction({ position, dimensions });
        break;
      case "countdown":
        props.resizeCountdown({ position, dimensions });
        break;
      default:
        props.resizeElement({
          index: index(),
          position,
          dimensions,
        });
        break;
    }
  };

  const getStyles = (element) => {
    switch (element.type) {
      case "instruction":
        return props.instruction_styles;
      case "countdown":
        return props.countdown_styles;
      default:
        return props.styles;
    }
  };

  return (
    <For each={props.elements}>
      {(element, index) => (
        <Show when={props.elementIsVisible(element)}>
          <CardElement
            element={element}
            position={getPosition(element)}
            locked={element.locked}
            dimensions={getDimensions(element)}
            styles={getStyles(element)}
            highlight_styles={props.highlight_styles}
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
              onResize({ index, position, dimensions });
            }}
            openPrompt={props.openPrompt}
            removeElement={() => props.removeElement(index())}
            masked={props.masked}
          >
            <Show when={index() === props.selected_element_index}>
              <ResizeHandles
                locked={element.locked}
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
                  onResize({ index, position, dimensions })
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
