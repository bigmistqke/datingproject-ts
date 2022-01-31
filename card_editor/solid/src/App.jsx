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
import { useStore } from "./store/Store";

import isColor from "./helpers/isColor";
import delay from "./helpers/delay";

import urls from "./urls";

import {
  HeaderPanel,
  FlexRow,
  Button,
  Span,
  FullScreen,
  Overlay,
} from "./components/panels/UI_Components";

import SidePanel from "./components/panels/SidePanel";

import TypeManager from "./components/TypeManager";

function App(props) {
  const { design_id } = useParams();
  const [state, actions] = useStore();
  const [instruction, setInstruction] = createStore({
    type: null,
    text: null,
    timespan: null,
  });

  createEffect(() => actions.setDesignId(design_id));

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

  const fetchDesign = async (design_id) => {
    try {
      let result = await fetch(
        `${urls.fetch}/api/design/get/${design_id}/development`
      );
      if (result.status !== 200) {
        throw result.statusText;
      }
      let { design } = await result.json();

      let types = Object.fromEntries(
        Object.entries(design.types).map(([type_id, type]) => {
          type.elements = type.elements.map((el) =>
            el.type !== "svg" || el.id ? el : { ...el, id: uniqid() }
          );
          return [type_id, type];
        })
      );

      if (!design) return false;
      return design;
    } catch (err) {
      console.error("error while fetching data", err);
      return false;
    }
  };

  onMount(async () => {
    window.addEventListener("resize", () => actions.updateCardSize);
    actions.updateCardSize();
    let design = await fetchDesign(design_id);
    console.log("design is", design);
    if (!design) {
      actions.createNewCard();
      return;
    }
    actions.setDeck(design);
  });

  return (
    <>
      {/* <Show when={state.viewport.type_manager}>
        <TypeManager />
      </Show> */}
      <App
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={(e) => e.preventDefault()}
        onDrop={actions.upload}
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
            e.buttons === 1 ? actions.setSelectedElementIndex(false) : null
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
        <SidePanel></SidePanel>
      </App>
    </>
  );
}

export default App;
