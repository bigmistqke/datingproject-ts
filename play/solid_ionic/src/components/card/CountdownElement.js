import { For } from "solid-js";

import { useStore } from '../../store/Store';

const CountdownElement = props => {
  const [, { getTextStyles, getTimer }] = useStore();
  const text_styles = getTextStyles({ element: props.element, swatches: props.swatches });

  const getTextAlignFromAlignment = () => {
    switch (text_styles.alignmentHorizontal) {
      case 'flex-start':
        return 'left';
      case 'center':
        return 'center';
      case 'flex-end':
        return 'right';
    }
  };

  return (
    <>
      <div className="text-container" style={text_styles}>
        <For each={props.card_state.formatted_text}>
          {instruction => (
            <span
              style={{
                'textAlign': getTextAlignFromAlignment(),
              }}>
              {getTimer()}
            </span>
          )}
        </For>
      </div>
    </>
  );
};

export default CountdownElement;
