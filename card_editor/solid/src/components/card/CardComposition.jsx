// import ResizeHandles from "../viewport/ResizeHandles";
import CardElement from "./CardElement";
import CardMask from "./CardMask";
import { For, Show, createEffect, createSignal } from "solid-js";

import { useStore } from "../../store/Store";

const CardCompositor = (props) => {
  const [state, actions] = useStore();
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

const CardComposition = (props) => {
  const [state, actions] = useStore();
  const [getSwatches, setSwatches] = createSignal([]);

  createEffect(() => {
    let type = actions.getType(props.instruction.type);
    if (!type) return;
    console.log("PROPS.MASKED IS ", props.masked);
    setSwatches(type.swatches.map((s) => (props.masked ? s.timed : s.normal)));
  });

  return (
    <For each={props.elements}>
      {(element, index) => (
        <Show when={actions.isElementVisible(element)}>
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

export default CardCompositor;
