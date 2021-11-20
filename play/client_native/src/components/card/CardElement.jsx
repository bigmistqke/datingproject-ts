import Draggable from '../viewport/Draggable';
import styled from 'styled-components';

import SVGElement from './SVGElement';
import TextElement from './TextElement';

const CardElement = props => {
  onMount(() => console.log('card mounted'));
  const openContext = async e => {
    e.preventDefault();
    e.stopPropagation();

    const result = await props.openPrompt({
      type: 'options',
      position: {x: e.clientX, y: e.clientY},
      data: {
        options: ['delete', 'fill', 'fill horizontally', 'fill vertically'],
      },
    });

    if (!result) return;

    switch (result) {
      case 'delete':
        props.removeElement();
        break;
      case 'fill':
        props.archiveStateChanges(
          props.onResize({
            dimensions: {width: 100, height: 100},
            position: {x: 0, y: 0},
          }),
        );
        break;
      case 'fill horizontally':
        props.archiveStateChanges(
          props.onResize({
            dimensions: {width: 100, height: props.dimensions.height},
            position: {x: 0, y: props.position.y},
          }),
        );
        break;
      case 'fill vertically':
        props.archiveStateChanges(
          props.onResize({
            dimensions: {width: props.dimensions.width, height: 100},
            position: {x: props.position.x, y: 0},
          }),
        );
        break;
    }
  };

  const Element = styled('div')`
    pointer-events: none;
    & > * {
      pointer-events: all;
    }
  `;

  const onPointerDown = e => {
    if (e.button === 0) props.onPointerDown(e);
    e.stopPropagation();
  };

  const onPointerUp = e => {
    if (e.button === 0) props.onPointerDown(e);
    e.stopPropagation();
  };

  return (
    <Draggable
      position={{...props.position}}
      style={
        props.dimensions
          ? {
              width: props.dimensions.width + '%',
              height: props.dimensions.height + '%',
            }
          : null
      }
      locked={props.locked}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onTranslate={props.onTranslate}
      onContextMenu={openContext}
      archiveStateChanges={props.archiveStateChanges}>
      <Element>
        {props.children}
        <Switch>
          <Match
            when={props.type === 'countdown' || props.type === 'instruction'}>
            <TextElement
              styles={props.styles}
              highlight_styles={props.highlight_styles}
              card_size={props.card_size}
              swatches={props.swatches}
              content={props.element.content}></TextElement>
          </Match>
          <Match when={props.type === 'svg'}>
            <SVGElement
              masked={props.masked}
              element={props.element}
              svg={props.element.svg}
              styles={props.element.styles}
              swatches={props.swatches}
              masked={props.masked}></SVGElement>
          </Match>
        </Switch>
      </Element>
    </Draggable>
  );
};

export default CardElement;
