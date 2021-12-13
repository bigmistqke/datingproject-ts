// import Draggable from '../viewport/Draggable';
import { styled } from "solid-styled-components";
import { createMemo, Show } from "solid-js";

import SVGElement from './SVGElement';
import InstructionElement from './InstructionElement';
import CountdownElement from './CountdownElement';

// import ResizeHandles from '../viewport/ResizeHandles';

import { useStore } from '../../store/Store';

const CardElement = props => {
  const [, { getPosition, getDimensions }] = useStore();
  const Element = styled("div")`
    pointer-events: none;
    & > * {
      pointer-events: all;
    }
  `
  let position = createMemo(() => getPosition(props.element))
  let dimensions = createMemo(() => getDimensions(props.element))
  return (
    <div
      position={{ ...position }}
      style={
        dimensions
          ? {
            width: dimensions.width,
            height: dimensions.height,
            position: 'absolute',
            left: position.x,
            top: position.y,
          }
          : null
      }>
      <Element>
        <Show when={props.type === 'instruction'}>
          <InstructionElement {...props}></InstructionElement>
        </Show>
        <Show when={props.type === 'svg'}>
          <SVGElement {...props}></SVGElement>
        </Show>
        {/* <Show when={props.type === 'countdown'}>
          <CountdownElement {...props}></CountdownElement>
        </Show>
        
        */}
      </Element>
    </div>
  );
};

export default CardElement;
