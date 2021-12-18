import CardCompositor from "./CardComposition";

import { Show, createEffect, createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import { useStore } from "../../store/Store";

import { styled } from "solid-styled-components";
import check from "../../helpers/check";

const CardRenderer = (props) => {
  const [state, actions] = useStore();

  const [card_state, setCardState] = createStore({
    modes: {
      timed: false,
      choice: false,
    },
    formatted_text: null,
    type: null,
  });

  const CardContainer = styled("div")`
    position: absolute;
    transform: translate(-50%, -50%);
    position: relative;
    overflow: hidden;
    left: 50%;
    top: 50%;
    background: white;
    box-shadow: 0px 0px 50px lightgrey;
    z-index: 5;
  `;

  createEffect(() => {
    setCardState("modes", "timed", props.instruction.timespan ? true : false);
    // console.log("UPDATE mode.timed in INSTRUCTION", modes.timed);
  });
  createEffect(() => setCardState("type", props.instruction.type));

  createEffect(() => {
    let formatted_text = [{ type: "normal", content: props.instruction.text }];
    // regex
    const regex_for_brackets = /[\["](.*?)[\]"][.!?\\-]?/g;
    let matches = String(props.instruction.text).match(regex_for_brackets);

    if (!matches) {
      setCardState("modes", "choice", false);
      setCardState("formatted_text", formatted_text);
      return;
    }

    for (let i = matches.length - 1; i >= 0; i--) {
      let split = formatted_text.shift().content.split(`${matches[i]}`);

      let multi_choice = matches[i].replace("[", "").replace("]", "");
      let choices = multi_choice.split("/");

      formatted_text = [
        { type: "normal", content: split[0] },
        { type: "choice", content: choices },
        { type: "normal", content: split[1] },
        ...formatted_text,
      ];
    }
    setCardState("modes", "choice", true);
    setCardState("formatted_text", formatted_text);
  });

  return (
    <>
      <CardContainer
        className="CardContainer"
        style={{
          width: `${state.viewport.card_size.width}px`,
          height: `${state.viewport.card_size.height}px`,
          "border-radius": state.design.border_radius * 0.9 + "vh",
        }}
      >
        <div className="viewport">
          <CardCompositor
            elements={actions.getLocalElements({
              type: props.instruction.type,
            })}
            card_state={card_state}
            {...props}
          ></CardCompositor>
        </div>
      </CardContainer>
    </>
  );
};

export default CardRenderer;
