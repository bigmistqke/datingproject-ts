import { onMount, For, createSignal, createMemo, createEffect } from "solid-js";
import { styled } from "solid-styled-components";

import {
  Button,
  FullScreen,
  Overlay,
  FlexColumn,
} from "./panels/UI_Components";

const PromptTypes = {
  confirm: (props) => (
    <>
      <Button
        onClick={() => {
          props.resolve(true);
        }}
      >
        confirm
      </Button>
      <Button
        onClick={() => {
          props.resolve(false);
        }}
        background_hue={getRandomHue(1)}
      >
        cancel
      </Button>
    </>
  ),
  options: (props) => (
    <For each={props.data.options}>
      {(option, index) => {
        return (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              props.resolve(option.value ? option.value : option);
            }}
            style={{ width: "100%" }}
          >
            {option.value ? option.value : option}
          </Button>
        );
      }}
    </For>
  ),
};

function Prompt(props) {
  // let [getPosition, setPosition] = createSignal();

  const closePrompt = (e) =>
    e.target.classList.contains("prompt_container") ? props.resolve() : null;

  // onMount(() => setPosition({ ...props.position }));

  const getStyle = createMemo(() => {
    let style = {};
    if (props.style) {
      style = props.style;
    }
    if (typeof props.position === "object") {
      style = {
        ...style,
        left: `${parseInt(props.position.x)}px`,
        top: `${parseInt(props.position.y)}px`,
        transform: "translate(-50%, -50%)",
      };
    } else {
      if (props.position === "center") {
        style = {
          ...style,
          left: "50vw",
          top: "50vh",
          transform: "translate(-50%,-50%)",
        };
      }
    }

    return style;
  }, [props.position]);

  onMount(() => {});

  return (
    <FullScreen className="prompt_container" onMouseDown={closePrompt}>
      <Overlay style={{ ...getStyle() }}>
        <FlexColumn style={{ gap: "6px" }}>
          {PromptTypes[props.type](props)}
        </FlexColumn>
      </Overlay>
    </FullScreen>
  );
}

export default Prompt;
