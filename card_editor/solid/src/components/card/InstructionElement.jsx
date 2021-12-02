import {
  createSignal,
  For,
  createMemo,
  Switch,
  Match,
  createEffect,
} from "solid-js";

import { useStore } from "../../Store";

const TextElement = (props) => {
  const [state, { getTextStyles, getHighlightStyles }] = useStore();

  const text_styles = createMemo(() =>
    getTextStyles({
      element: props.element,
      swatches: props.swatches,
    })
  );

  const highlight_styles = createMemo(() =>
    getHighlightStyles({ element: props.element, swatches: props.swatches })
  );

  return (
    <>
      <div className="text-container" style={text_styles()}>
        <For each={props.card_state.formatted_text}>
          {(instruction) => (
            <Switch>
              <Match when={instruction.type === "normal"}>
                <span
                  style={{
                    "text-align": text_styles()["align-items"],
                  }}
                >
                  {instruction.content}
                </span>
              </Match>
              <Match when={instruction.type === "choice"}>
                <div
                  style={{
                    "text-align": highlight_styles()["align-items"],
                    width: "100%",
                  }}
                >
                  <For each={instruction.content}>
                    {(choice) => (
                      <div style={{ ...highlight_styles() }}>
                        <span
                          style={{
                            flex: "none",
                          }}
                        >
                          {choice}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </Match>
            </Switch>
          )}
        </For>
      </div>
    </>
  );
};

export default TextElement;
