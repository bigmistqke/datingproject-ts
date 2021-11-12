import { createSignal, createEffect } from "solid-js";
import { HeaderPanel, FlexRow, Button } from "./UI_Components";
import Color from "./Color";

const Swatches = (props) => {
  const [getSelected, setSelected] = createSignal(false);

  let input;

  const onDrop = (e) => {
    let color = parseInt(e.dataTransfer.getData("color"));
  };

  let last_time = performance.now();
  const onInput = (e) => {
    if (performance.now() - last_time < 1000 / 30) return;
    last_time = performance.now();
    props.setSwatch(getSelected(), e.target.value);
  };

  return (
    <>
      <input
        ref={input}
        type="color"
        value={props.swatches[getSelected()]}
        style={{ display: "none" }}
        onInput={onInput}
      ></input>
      <HeaderPanel
        label="Swatches"
        visible={true}
        extra={
          <Show when={!props.hide_modes}>
            <Button onClick={props.toggleMaskedStyling}>
              {props.masked_styling ? "timed" : "default"}
            </Button>
          </Show>
        }
      >
        <FlexRow onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <For each={props.swatches}>
            {(color, index) => (
              <Color
                onClick={() => {
                  setSelected(index());
                  input.click();
                }}
                draggable={true}
                onDragStart={(e) =>
                  e.dataTransfer.setData("swatch_index", index())
                }
                onDragOver={(e) => e.preventDefault()}
                style={{
                  background: color,
                }}
              ></Color>
            )}
          </For>
          <Button onClick={props.addSwatch}>add</Button>
        </FlexRow>
      </HeaderPanel>
    </>
  );
};
export default Swatches;
