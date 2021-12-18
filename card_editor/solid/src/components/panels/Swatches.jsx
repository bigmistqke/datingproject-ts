import { createSignal, createEffect, Index, onMount } from "solid-js";
import {
  HeaderPanel,
  FlexRow,
  Button,
  Color,
  ColorPicker,
} from "./UI_Components";
// import Color from "./Color";

import { useStore } from "../../store/Store";

// swatches={getSelectedSwatches()}
// swatches={getSelectedSwatches(state.viewport.masked_styling)}
/*  setSwatch={setSwatch}
                addSwatch={addSwatch}
                timed={state.viewport.modes.timed}
                masked_styling={state.viewport.masked_styling}
                toggleMaskedStyling={(e) => toggleMaskedStyling(e)}
                hide_modes={state.viewport.type === "back"} */
// archiveStateChanges={archiveStateChanges}

const Swatches = (props) => {
  const [
    state,
    { getSelectedSwatches, setSwatch, addSwatch, toggleMaskedStyling },
  ] = useStore();
  const onDrop = (e) => {
    let color = parseInt(e.dataTransfer.getData("color"));
  };

  return (
    <>
      <HeaderPanel
        label="Swatches"
        visible={true}
        extra={
          <Show when={state.viewport.type !== "back"}>
            <Button onClick={toggleMaskedStyling}>
              {props.masked_styling ? "timed" : "default"}
            </Button>
          </Show>
        }
      >
        <FlexRow onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
          <Index each={getSelectedSwatches()}>
            {(color, index) => (
              <ColorPicker
                onClick={() => {
                  //setSelected(index);
                  // input.click();
                }}
                onInput={(value) => setSwatch(index, value)}
                value={color()}
                draggable={true}
                index={index}
              ></ColorPicker>
            )}
          </Index>
          <Button onClick={addSwatch}>add</Button>
        </FlexRow>
      </HeaderPanel>
    </>
  );
};
export default Swatches;
