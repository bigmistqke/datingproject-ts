import CardCompositor from "./CardComposition";

import { Show, createEffect } from "solid-js";
import { createStore } from "solid-js/store";

import { styled } from "solid-styled-components";
import check from "../../helpers/check";

const CardRenderer = (props) => {
  createEffect(() => console.log("props.card_size", props.card_size));
  const [state, setState] = createStore({
    modes: {},
    formatted_text: null,
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

  const getSelectedType = () => props.deck.types[props.instruction.type];
  const getLocalElements = () =>
    getSelectedType() ? getSelectedType().elements : [];

  const getGlobalElement = (id) => props.deck.globals[id];

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
  };

  createEffect(() =>
    setState("modes", "timed", props.instruction.timespan ? true : false)
  );

  createEffect(() => {
    let formatted_text = [{ type: "normal", content: props.instruction.text }];
    // regex
    const regex_for_brackets = /[\["](.*?)[\]"][.!?\\-]?/g;
    let matches = String(props.content).match(regex_for_brackets);

    if (!matches) {
      setState("modes", "choice", false);
      setState("formatted_text", formatted_text);
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

    setState("modes", "choice", true);
    setState("formatted_text", formatted_text);
  });

  const getSelectedSwatches = (timed = false) =>
    getSelectedType().swatches.map((s) => (timed ? s.timed : s.normal));

  return (
    <>
      <CardContainer
        className="CardContainer"
        style={{
          width: `${props.card_size.width}px`,
          height: `${props.card_size.height}px`,
          "border-radius": props.deck.border_radius * 0.9 + "vh",
        }}
      >
        <div className="viewport">
          <CardCompositor
            deck={props.deck}
            card_size={props.card_size}
            elements={getLocalElements()}
            swatches={getSelectedSwatches()}
            globals={props.deck.globals}
            getStyles={getStyles}
            formatted_text={state.formatted_text}
            modes={state.modes}
          ></CardCompositor>
        </div>
      </CardContainer>
    </>
  );
};

export default CardRenderer;
