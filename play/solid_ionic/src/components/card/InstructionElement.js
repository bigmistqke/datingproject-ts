import { createMemo, Show, For } from "solid-js";

import { useStore } from '../../store/Store';

const InstructionElement = props => {
  const [, { getTextStyles, getHighlightStyles }] = useStore();

  const text_styles = createMemo(() =>
    getTextStyles({
      element: props.element,
      swatches: props.swatches,
    }),
    [props.element, props.swatches]
  )

  const highlight_styles = () =>
    getHighlightStyles({ element: props.element, swatches: props.swatches });



  return (
    <>
      <div className="text-container" style={text_styles}>
        <For each={props.formatted_text}>
          {(instruction, index) => (
            <div key={index}>
              <Show when={instruction.type === 'normal'}>
                <span
                  style={text_styles}>
                  {instruction.content}
                </span>
              </Show>
              <Show when={instruction.type === 'choice'}>
                <div
                  style={{
                    // 'textAlign': highlight_styles()['align-items'],
                    // width: '100%',
                  }}>
                  <For each={instruction.content}>
                    {(choice, index) => (
                      <div key={index} /* style={{ ...highlight_styles() }} */>
                        <span
                          style={{
                            flex: 'none',
                          }}>
                          {choice}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>
    </>
  );
};

export default InstructionElement;
