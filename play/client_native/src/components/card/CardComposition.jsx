import CardElement from './CardElement';

import React, {useEffect} from 'react';
import {For, Show} from '../solid-like-components';

const CardComposition = props => {
  const getDimensions = element => {
    if (element.global) {
      return props.globals[element.id].dimensions;
    } else {
      return element.dimensions;
    }
  };

  const getPosition = element => {
    if (element.global) {
      return props.globals[element.id].position;
    } else {
      return element.position;
    }
  };

  const onTranslate = (index, delta) => {
    props.translateElement({index, delta});
  };

  createEffect(() => console.log('GET STYLES IS ', props.getStyles), []);
  return (
    <For each={props.elements}>
      {(element, index) => (
        <Show when={props.isElementVisible(element)}>
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
            onTranslate={delta =>
              props.translateElement({index: index(), delta})
            }
            onPointerDown={() => {
              props.selectElement(index());
            }}
            // onPointerUp={}
            /* onResize={({position, dimensions}) =>
              props.resizeElement({index: index(), position, dimensions})
            } */
            openPrompt={props.openPrompt}
            removeElement={() => props.removeElement(index())}
            masked={props.masked}
            archiveStateChanges={props.archiveStateChanges}></CardElement>
        </Show>
      )}
    </For>
  );
};

export default CardComposition;
