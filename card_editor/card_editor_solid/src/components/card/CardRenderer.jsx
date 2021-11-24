import CardCompositor from "./CardComposition";

import { Show, createEffect, createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import { useStore } from "../../Store";

import { styled } from "solid-styled-components";
import check from "../../helpers/check";

const CardRenderer = (props) => {
  const [state, { getLocalElements }] = useStore();

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

  /*   const getSelectedType = () => props.design.types[props.instruction.type];
  const getLocalElements = () =>
    getSelectedType() ? getSelectedType().elements : [];

  const getGlobalElement = (id) => props.design.globals[id];

  const getLocalElement = ({ index, id }) => {
    if (id) index = getLocalElements().findIndex((e) => e.id === id);
    if (check(index)) return getLocalElements()[index];
    return false;
  };

  const getStyles = ({ id, index, highlight }) => {
    const local_element = getLocalElement({ id, index });
    if (!local_element) return {};
    const style_type = highlight ? "highlight_styles" : "styles";
    return {
      ...getGlobalElement(local_element.id)[style_type],
      ...local_element[style_type],
    };
  }; */

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

  const getSelectedSwatches = (timed = false) =>
    getSelectedType().swatches.map((s) => (timed ? s.timed : s.normal));

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
            elements={getLocalElements({ type: props.instruction.type })}
            card_state={card_state}
            {...props}
          ></CardCompositor>
        </div>
      </CardContainer>
    </>
  );
};

export default CardRenderer;
