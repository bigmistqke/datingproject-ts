import ImageUploader from "./managers/ImageUploader";
import "./App.css";

import uniqid from "uniqid";

import { createEffect, For, createMemo, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { useParams } from "solid-app-router";

import CardRenderer from "./components/card/CardRenderer";

// import Guides from "./components/viewport/Guides";
import Rulers from "./components/viewport/Rulers";
import MaskHandle from "./components/viewport/MaskHandle";

import Prompt from "./components/Prompt";

import { styled } from "solid-styled-components";
import { useStore } from "./Store";

import {
  HeaderPanel,
  LabeledInput,
  LabeledColor,
  LabeledCheckbox,
  FlexRow,
  GridRow,
  Label,
  Button,
  Span,
  LabeledColorPicker,
  FullScreen,
  Overlay,
} from "./components/panels/UI_Components";

import SidePanel from "./components/panels/SidePanel";

function App(props) {
  const { card_id } = useParams();
  const [
    state,
    {
      updateCardSize,
      setDeck,
      upload,
      toggleTypeManager,
      createNewCard,
      setCardId,
      setSelectedElementIndex,
    },
  ] = useStore();
  const [instruction, setInstruction] = createStore({
    type: null,
    text: null,
    timespan: null,
  });
  // window.instruction = instruction;

  createEffect(() => setCardId(card_id));

  createEffect(() => {
    setInstruction("type", state.viewport.type);
    setInstruction("timespan", state.viewport.modes.timed ? 30 : false);
    setInstruction(
      "text",
      state.viewport.modes.choice
        ? lorem_ipsum.choice[0]
        : lorem_ipsum.normal[0]
    );
  });

  createEffect(() => console.log(state.viewport.modes.timed));

  createEffect(() => console.log(instruction.timespan));

  const lorem_ipsum = {
    normal: [
      "A week ago, when I returned home from doing my weekly groceries, I passed a theatre, ...",
      "For a minute, I lost myself.",
      "but as a traveler, or rather a philosopher.” Well, long story short: I had a chat with this man, ",
      "I know. This heatwave has me sweating like a pig in a butchers shop.",
    ],
    choice: [
      "That boat is taking [cocaine / vaccines / refugees / Coca cola] to [Antwerp / Rotterdam / the UK / Calais]",
      "I [ would / would not ] want to live there, because [ ... ]",
      "I think that [death / paradise / hope / suffering / redemption] is waiting for us over there.",
      "And that one is taking [4x4 cars / ayuhuasca / underpaid workers / cows and pigs] to Dubai.",
    ],
  };
  //    styled components

  const App = styled("div")`
    text-align: center;
    height: 100vh;
    width: 100vw;
    position: absolute;
    overflow: hidden;
    flex-direction: row;
    display: flex;
    flex: 1;
  `;

  const Viewport = styled("div")`
    flex: 1;
    position: relative;
  `;

  const fetchDeck = async (card_id) => {
    try {
      let result = await fetch(`${props.urls.fetch}/api/design/get/${card_id}`);
      let design = await result.json();
      console.log("design is ", design);
      if (!design) return false;
      return design;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const renderSvg = ({ svg, card_dimensions }) => {
    const canvas = document.createElement("canvas");
    canvas.width = (svg.dimensions.width / 100) * card_dimensions.width * 100;
    canvas.heigt = (svg.dimensions.height / 100) * card_dimensions.heigt * 100;
  };

  const processDeck = async () => {
    let production_deck = {};
    Object.entries(state.design.types).forEach(([type_name, type]) =>
      type.elements.forEach((element) => {
        switch (element.type) {
          case "svg":
            console.log(element);

            break;
          default:
            break;
        }
      })
    );
  };

  const saveDeck = async () => {
    try {
      // let development = state.design;
      // let production = action.processDesign();

      console.log(state.design);

      let result = await fetch(
        `${props.urls.fetch}/api/design/save/${card_id}`,
        {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          redirect: "follow",
          referrerPolicy: "no-referrer",
          body: JSON.stringify(state.design),
        }
      );
      result = await result.json();
      console.log(result);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  onMount(async () => {
    window.addEventListener("resize", () => updateCardSize);
    updateCardSize();
    let design = await fetchDeck(card_id);
    if (!design) {
      createNewCard();
      return;
    }
    setDeck(design);
  });

  return (
    <>
      <Show when={state.viewport.type_manager}>
        <FullScreen
          className="prompt_container"
          onMouseDown={(e) =>
            e.target.classList.contains("type_manager")
              ? toggleTypeManager
              : null
          }
        >
          <Overlay
            style={{
              left: "50%",
              top: "50%",
              width: "200px",
              transform: "translate(-50%,-50%)",
            }}
          >
            <HeaderPanel
              label="Type Manager"
              extra={<Button>add new type</Button>}
              always_visible={true}
            >
              <FlexRow>
                <For each={Object.keys(state.design.types)}>
                  {(type) => (
                    <Span contenteditable style={{ flex: 1 }}>
                      {type}
                    </Span>
                  )}
                </For>
              </FlexRow>
            </HeaderPanel>
          </Overlay>
        </FullScreen>
      </Show>
      <App
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
        onDrop={upload}
        style={{ background: state.design.background }}
      >
        <Show when={state.viewport.prompt}>
          <Prompt
            type={state.viewport.prompt.type}
            data={state.viewport.prompt.data}
            position={state.viewport.prompt.position}
            resolve={state.viewport.prompt.resolve}
          ></Prompt>
        </Show>
        <Viewport
          className="viewport"
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}
          onMouseDown={(e) =>
            e.buttons === 1 ? setSelectedElementIndex(false) : null
          }
        >
          <Rulers
            card_dim={state.design.card_dimensions}
            guides={state.guides}
            shouldSnap={state.bools.shouldSnap}
          ></Rulers>
          <Show when={state.viewport.modes.timed}>
            <MaskHandle></MaskHandle>
          </Show>

          <CardRenderer
            // card_size={state.viewport.card_size}
            // design={state.design}
            instruction={instruction}
          ></CardRenderer>
        </Viewport>
        <SidePanel processDeck={processDeck} saveDeck={saveDeck}></SidePanel>
      </App>
    </>
  );
}

export default App;
