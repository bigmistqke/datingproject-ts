// import ResizeHandles from "../viewport/ResizeHandles";
import CardElement from "./CardElement";
import CardMask from "./CardMask";
import { For, Show, createEffect, createSignal } from "solid-js";

import { useStore } from "../../Store";

const CardComposition = (props) => {
  const [state, { getType }] = useStore();
  const [getSwatches, setSwatches] = createSignal([]);

  createEffect(() => {
    let type = getType(props.instruction.type);
    if (!type) return;
    console.log("PROPS.MASKED IS ", props.masked);
    setSwatches(type.swatches.map((s) => (props.masked ? s.timed : s.normal)));
  });

  const isElementVisible = (element) => {
    let modes;
    if (element.global) {
      modes = state.design.globals[element.id].modes;
    } else {
      modes = element.modes;
    }
    for (let [mode_type, activated] of Object.entries(props.card_state.modes)) {
      if (modes[mode_type] !== 1 && modes[mode_type] !== (activated ? 2 : 0)) {
        return false;
      }
    }
    return true;
  };

  return (
    <For each={props.elements}>
      {(element, index) => (
        <Show when={isElementVisible(element)}>
          <CardElement
            index={index()}
            element={element}
            type={element.type}
            locked={element.locked}
            swatches={getSwatches()}
            {...props}
          ></CardElement>
        </Show>
      )}
    </For>
  );
};

const CardCompositor = (props) => {
  const [state, { getType }] = useStore();

  createEffect(() =>
    console.log("PROPS.CARD_STATE.TIMED", props.card_state.modes.timed)
  );
  return (
    <>
      <CardComposition {...props}></CardComposition>
      <Show when={props.card_state.modes.timed}>
        <CardMask percentage={state.viewport.timer_percentage}>
          <CardComposition {...props} masked={true}></CardComposition>
        </CardMask>
      </Show>
    </>
  );
};

export default CardCompositor;
