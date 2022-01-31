import { createSignal, Show, For, onMount } from "solid-js";
import { useStore } from "../store/Store";
import {
  Button,
  FlexRow,
  FullScreen,
  HeaderPanel,
  LabeledInput,
  Overlay,
  Span,
} from "./panels/UI_Components";

export default function TypeManager() {
  const [state, actions] = useStore();
  const [mode, setMode] = createSignal("overview");
  const [newTypes, setNewTypes] = createSignal();

  onMount(() => {
    setNewTypes(
      Oject.keys(state.design.types).map((type_name) => [type_name, type_name])
    );
  });

  return (
    <FullScreen
      className="prompt_container"
      onMouseDown={actions.closeTypeManager}
    >
      <Overlay
        style={{
          left: "50%",
          top: "50%",
          width: "200px",
          transform: "translate(-50%,-50%)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <HeaderPanel
          label="Type Manager"
          extra={<Button onCLick={actions.addNewType}>add new type</Button>}
          always_visible={true}
        >
          <Show when={mode() === "overview"}>
            <FlexRow>
              <For each={Object.keys(state.design.types)}>
                {(type) => (
                  <Span contenteditable style={{ flex: 1 }}>
                    {type}
                  </Span>
                )}
              </For>
            </FlexRow>
          </Show>
        </HeaderPanel>
      </Overlay>
    </FullScreen>
  );
}
