import Draggable from '../viewport/Draggable';
import CardElement from './Card_Element';
import CardMask from './CardMask';

// import { For, Show } from "solid-js";
import {For, Show} from '../solid-like-components';

const CardRenderer = props => {
  const isVisible = element => {
    // TODO:  maybe a smarter way of determining state and right behavior?
    //        feels like an obvious pattern i m missing where we would be able
    //        to scale and add different modes more easily

    // NO TIMER — NO CHOICE
    if (!props.timed && !props.choice) {
      if (
        (element.modes.visible === 1 || element.modes.visible === 0) &&
        (element.modes.timed === 1 || element.modes.timed === 0)
      ) {
        return true;
      } else {
        return false;
      }
    }

    // YES TIMER — NO CHOICE
    if (props.timed && !props.choice) {
      if (
        (element.modes.timed === 1 || element.modes.timed === 2) &&
        (element.modes.visible === 1 || element.modes.visible === 0)
      ) {
        return true;
      }
    }

    // NO TIMER — YES CHOICE
    if (!props.timed && props.choice) {
      if (
        (element.modes.timed === 1 || element.modes.timed === 0) &&
        (element.modes.visible === 1 || element.modes.visible === 2)
      ) {
        return true;
      }
    }

    // YES TIMER — YES CHOICE
    if (props.timed && props.choice) {
      if (
        (element.modes.timed === 1 || element.modes.timed === 2) &&
        (element.modes.visible === 1 || element.modes.visible === 2)
      ) {
        return true;
      }
    }

    return false;
  };

  return (
    <>
      <For each={props.elements}>
        {(element, index) => (
          <Show when={isVisible(element)}>
            <Draggable
              position={{...getPosition(element)}}
              style={
                props.dimensions
                  ? {
                      width: props.dimensions.width + '%',
                      height: props.dimensions.height + '%',
                    }
                  : null
              }
              locked={true}
              onPointerDown={e => {
                if (e.button === 0) props.onPointerDown(e);
                e.stopPropagation();
              }}
              // onPointerUp={props.onPointerUp}
              onPointerUp={e => {
                if (e.button === 0) props.onPointerDown(e);
                e.stopPropagation();
              }}
              onTranslate={props.onTranslate}
              onContextMenu={openContext}>
              <CardElement
                swatches={props.swatches.normal}
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
                timed={props.timed}
                onTranslate={delta => onTranslate(index(), delta)}
                onPointerDown={() => {
                  props.selectElement(index());
                }}
                // onPointerUp={}
                onResize={({position, dimensions}) => {
                  onResize({index, position, dimensions});
                }}
                openPrompt={props.openPrompt}
                removeElement={() => props.removeElement(index())}
                masked={props.masked}>
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
                    onResize={({position, dimensions}) =>
                      onResize({index, position, dimensions})
                    }></ResizeHandles>
                </Show>
              </CardElement>
            </Draggable>
          </Show>
        )}
      </For>
      <Show when={props.timed}>
        <CardMask percentage={props.timer_progress}>
          <For each={props.elements}>
            {(element, index) => (
              <Show when={isVisible(element)}>
                <CardElement
                  swatches={props.swatches.timed}
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
                  timed={props.timed}
                  onTranslate={delta => onTranslate(index(), delta)}
                  onPointerDown={() => {
                    props.selectElement(index());
                  }}
                  // onPointerUp={}
                  onResize={({position, dimensions}) => {
                    onResize({index, position, dimensions});
                  }}
                  openPrompt={props.openPrompt}
                  removeElement={() => props.removeElement(index())}
                  masked={props.masked}>
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
                      onResize={({position, dimensions}) =>
                        onResize({index, position, dimensions})
                      }></ResizeHandles>
                  </Show>
                </CardElement>
              </Show>
            )}
          </For>
        </CardMask>
      </Show>
    </>
  );
};

export default CardRenderer;
