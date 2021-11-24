import ImageUploader from "./managers/ImageUploader";
import "./App.css";

import { createEffect, Switch, For, Match, createMemo } from "solid-js";
import { createStore } from "solid-js/store";
import { useParams } from "solid-app-router";

import RightPanel from "./components/RightPanel";
import { HierarchyList, HierarchyElement } from "./components/Hierarchy";
import CardElement from "./components/CardElement";
// import HierarchyElement from "./components/HierarchyElement";

import LayOut from "./components/LayOut";
// import TextTypes from "./components/TextTypes";
import TextOptions from "./components/TextOptions";
import BottomPanel from "./components/BottomPanel";
// import CardContainer from "./components/CardContainer";
import Guides from "./components/Guides";
import Rulers from "./components/Rulers";
import ResizeHandles from "./components/ResizeHandles";
import BlurBorder from "./components/BlurBorder";

import Prompt from "./components/Prompt";

import { array_move, array_remove } from "./helpers/Pure";

import { styled } from "solid-styled-components";

// import { GUI_Container } from "./components/GUI_Components";

function App(props) {
  const { card_id } = useParams();

  const getCardSize = createMemo(() => ({
    height: window.innerHeight * 0.9,
    width: window.innerHeight * 0.9 * 0.5588507940957915,
  }));

  const [state, setState] = createStore({
    pressed_keys: [],
    bools: {
      shouldSnap: false,
      isShiftPressed: false,
      isAltPressed: false,
      areGuidesLocked: false,
      areGuidesHidden: false,
    },
    guides: [],
    card: {
      dimensions: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      types: ["do", "say", "think"],
      designs: {
        do: [
          {
            timed: false,
            choice: false,
            elements: [],
          },
        ],
      },
    },
    viewport: {
      selected_element: false,
      card_selected: {
        type: "do",
        timed: false,
        choice: false,
      },
      prompt: false,
    },
  });

  const image_uploader = new ImageUploader({ card_id });

  const lorem_ipsum = [
    "A week ago, when I returned home from doing my weekly groceries, I passed a theatre, ...",
  ];

  const getSelectedDesign = createMemo(() => {
    let all_designs_of_type =
      state.card.designs[state.viewport.card_selected.type];

    if (!all_designs_of_type) return undefined;

    let selected_design = all_designs_of_type.find(
      (design) =>
        design.timed === state.viewport.card_selected.timed &&
        design.choice === state.viewport.card_selected.choice
    );

    return selected_design;
  });

  const getElementsOfSelectedDesign = createMemo(() => {
    let selected_design = getSelectedDesign();
    console.log("selected_design", { ...selected_design });

    if (!selected_design) return [];
    console.log("selected_design.elements", [...selected_design.elements]);
    return selected_design.elements;
  });

  const setType = (type) => setState("viewport", "card_selected", "type", type);
  const setTimed = (bool) =>
    setState("viewport", "card_selected", "timed", bool);
  const setChoice = (bool) =>
    setState("viewport", "card_selected", "choice", bool);

  const fetchCards = async (card_id) => {
    let result = await fetch(`${props.urls.fetch}/api/card/get/${card_id}`);
    result = await result.json();
    if (!result) return false;
    setState("designs", result.designs);
    return true;
  };

  const saveCards = () => {
    console.log({ ...state.card.designs });
  };

  createEffect(async () => {
    let result = await fetchCards(card_id);
    if (result) return;
    createNewCard();
  });

  const updateCardDim = (dim) => {
    console.log("updateCardDim", dim);
    setState("card", "dimensions", dim);
  };

  const uploadImage = (e) => {
    /* e.preventDefault();

    let position = {
      x:
        ((e.clientX - state.card.dimensions.x) / state.card.dimensions.width) *
        100,
      y:
        ((e.clientY - state.card.dimensions.y) / state.card.dimensions.height) *
        100,
    };

    var file = e.dataTransfer.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function ({ target }) {
      let img = new Image();
      img.onload = async function () {
        let element = {
          type: "image",
          src: target.result,
          origin: position,
          dim: {
            width: 25,
            height:
              (this.height / this.width) *
              25 *
              (state.card.dimensions.width / state.card.dimensions.height),
          },
          locked: false,
          z: Object.values(viewport.state).length,
        };
        let element_id = uniqid();
        setState(
          "designs",
          state.viewport.card_selected.type,
          element_id,
          element
        );
        // viewport.update(element_id, element);
        let uploaded = await image_uploader.current.process({
          file,
          element_id,
        });
        if (!uploaded.success) return;
        element.src = uploaded.url.replace("./", "");

        // viewport.update(element_id, element);
      };
      img.src = target.result;
    };
    reader.readAsDataURL(file); */
  };

  const dragOver = (e) => {
    console.log("THIS ISHAPPENING");
    e.preventDefault();
  };

  const selectElement = (element) =>
    setState("viewport", "selected_element", element);

  const translateElement = ({ index, delta }) => {
    setState(
      "card",
      "designs",
      state.viewport.card_selected.type,
      (design) =>
        design.timed === state.viewport.card_selected.timed &&
        design.choice === state.viewport.card_selected.choice,
      "elements",
      index,
      "position",
      (position) => ({
        x: position.x + (delta.x / getCardSize().width) * 100,
        y: position.y + (delta.y / getCardSize().height) * 100,
      })
    );
  };

  const removeElement = (index) => {
    setState(
      "card",
      "designs",
      state.viewport.card_selected.type,
      (design) =>
        design.timed === state.viewport.card_selected.timed &&
        design.choice === state.viewport.card_selected.choice,
      "elements",
      array_remove(getElementsOfSelectedDesign(), index)
    );
  };

  const changeOrderOfElement = (from, to) => {
    console.log(from, to);
    setState(
      "card",
      "designs",
      state.viewport.card_selected.type,
      (design) =>
        design.timed === state.viewport.card_selected.timed &&
        design.choice === state.viewport.card_selected.choice,
      "elements",
      array_move(getElementsOfSelectedDesign(), from, to)
    );
  };

  const resizeElement = ({ index, dimensions, position }) => {
    setState(
      "card",
      "designs",
      state.viewport.card_selected.type,
      (design) =>
        design.timed === state.viewport.card_selected.timed &&
        design.choice === state.viewport.card_selected.choice,
      "elements",
      index,
      "position",
      position
    );
    setState(
      "card",
      "designs",
      state.viewport.card_selected.type,
      (design) =>
        design.timed === state.viewport.card_selected.timed &&
        design.choice === state.viewport.card_selected.choice,
      "elements",
      index,
      "dimensions",
      dimensions
    );
  };

  const setGuides = (g) => setState("guides", g);

  const FlexRow = styled("div")`
    display: flex;
    flex-direction: row;
    gap: 5px;
  `;

  const createNewCard = () => {
    let template = (timed, choice) => ({
      timed,
      choice,
      elements: [
        {
          type: "text",
          position: {
            x: 50,
            y: 50,
          },
          dimensions: {
            width: 50,
            height: 50,
          },
          options: {},
          content: "hallo",
        },
        {
          type: "text",
          position: {
            x: 50,
            y: 50,
          },
          dimensions: {
            width: 50,
            height: 50,
          },
          options: {},
          content: "hallo",
        },
        {
          type: "text",
          position: {
            x: 50,
            y: 50,
          },
          dimensions: {
            width: 50,
            height: 50,
          },
          options: {},
          content: "hallo",
        },
        {
          type: "text",
          position: {
            x: 10,
            y: 5,
          },
          dimensions: {
            width: 150,
            height: 50,
          },
          options: {},
          content: "yeeeehaaaaaaaaaa",
        },
      ],
    });

    let designs = {};
    state.card.types.forEach((type) => {
      designs[type] = [];

      designs[type].push(template(false, false));
      designs[type].push(template(false, true));
      designs[type].push(template(true, false));
      designs[type].push(template(true, true));
    });
    console.log("createNewCard designs are ", designs);
    setState("card", "designs", designs);
  };

  const openPrompt = ({ type, data }) =>
    new Promise((_resolve) => {
      const resolve = (data) => {
        setState("viewport", "prompt", false);
        _resolve(data);
      };

      setState("viewport", "prompt", {
        type,
        data,
        position: "center",
        resolve,
      });
    });

  const CardContainer = styled("div")`
    position: absolute;
    transform: translate(-50%, -50%);
    left: 50%;
    top: 50%;
    border-radius: var(--b-radius);
    background: white;
  `;

  return (
    <div className="app flex-container">
      <Show when={state.viewport.prompt}>
        <Prompt
          type={state.viewport.prompt.type}
          data={state.viewport.prompt.data}
          position={state.viewport.prompt.position}
          resolve={state.viewport.prompt.resolve}
        ></Prompt>
      </Show>
      <div
        className="card-container"
        onDrop={(e) => {
          e.preventDefault();
          console.log(e);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          console.log(e);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          console.log(e);
        }}
      >
        <Rulers
          card_dim={state.card.dimensions}
          guides={state.guides}
          shouldSnap={state.bools.shouldSnap}
        ></Rulers>
        <CardContainer
          shouldSnap={state.bools.shouldSnap}
          card_dim={state.card.dimensions}
          guides={state.guides}
          updateCardDim={updateCardDim}
          shiftPressed={state.bools.isShiftPressed}
        >
          <div className="viewport">
            <For each={getElementsOfSelectedDesign()}>
              {(element, index) => (
                <CardElement
                  element={element}
                  card_dimensions={state.card.dimensions}
                  card_size={getCardSize()}
                  guides={state.guides}
                  shouldSnap={state.bools.shouldSnap}
                  shiftPressed={state.bools.isShiftPressed}
                  altPressed={state.bools.isAltPressed}
                  loremIpsum={lorem_ipsum.current}
                  zIndex={index}
                  onTranslate={(delta) =>
                    translateElement({ index: index(), delta })
                  }
                  onPointerDown={() => {
                    console.log({ ...element });
                    selectElement({ ...element });
                  }}
                  // onPointerUp={}
                  onResize={({ position, dimensions }) =>
                    resizeElement({ index: index(), position, dimensions })
                  }
                  openPrompt={openPrompt}
                  removeElement={() => removeElement(index())}
                >
                  {element.content}
                  <Show
                    when={true}
                    // when={element.id === state.viewport.selected_element_id}
                  >
                    <ResizeHandles
                      element={element}
                      guides={state.guides}
                      card_dim={state.card.dimensions}
                      card_size={getCardSize()}
                      shiftPressed={state.bools.isShiftPressed}
                      altPressed={state.bools.isAltPressed}
                      onResize={({ position, dimensions }) =>
                        resizeElement({ index: index(), position, dimensions })
                      }
                    ></ResizeHandles>
                  </Show>
                </CardElement>
              )}
            </For>
          </div>
          {!state.bools.areGuidesHidden ? (
            <Guides
              card_dim={state.card.dimensions}
              guides={state.guides}
              shouldSnap={state.bools.shouldSnap}
            ></Guides>
          ) : null}
        </CardContainer>

        <BottomPanel
          setType={setType}
          typeInFocus={state.viewport.card_selected.type}
        >
          type:
          <For each={state.card.types}>
            {(type) => (
              <button
                classList={{
                  focus: state.viewport.card_selected.type === type,
                }}
                onClick={() => setType(type)}
              >
                {type}
              </button>
            )}
          </For>
          timed:
          <input
            type="checkbox"
            checked={state.viewport.card_selected.timed}
            onInput={(e) => setTimed(e.target.checked)}
          ></input>
          choice:
          <input
            type="checkbox"
            checked={state.viewport.card_selected.choice}
            onInput={(e) => setChoice(e.target.checked)}
          ></input>
        </BottomPanel>
      </div>

      <RightPanel>
        <FlexRow>
          <button onClick={createNewCard}>new card</button>
          <button onClick={saveCards}>save card</button>
          <button onClick={saveCards}>manage types</button>
          <button onClick={saveCards}>overview</button>
        </FlexRow>

        <HierarchyList
          elements={getElementsOfSelectedDesign()}
          onChangeOrder={changeOrderOfElement}
        >
          <For each={getElementsOfSelectedDesign()}>
            {(element, index) => (
              <HierarchyElement
                index={index()}
                removeElement={removeElement}
                onChangeOrder={changeOrderOfElement}
                element={element}
              ></HierarchyElement>
            )}
          </For>
        </HierarchyList>

        {/* <GUI_Container label="Hierarchy" onDrop={onDrop} onDragOver={allowDrag}>
          <div onDrop={onDrop} className="hierarchy-container">
            {props.children}
          </div>
        </GUI_Container> */}

        {/* <Show
          when={
            state.viewport.selected_element.type &&
            state.viewport.selected_element.type.indexOf("text") != -1
          }
        >
          <TextOptions
            //   viewport={viewport}
            element={state.card.designs[state.viewport.card_selected.type]}
          ></TextOptions>
        </Show> */}
        <LayOut
          guides={state.guides}
          setGuides={setGuides}
          card_dimensions={state.card.dimensions}
        ></LayOut>
      </RightPanel>
    </div>
  );
}

export default App;
