import ImageUploader from "./managers/ImageUploader";
import "./App.css";

import uniqid from "uniqid";

import { createEffect, For, createMemo, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { useParams } from "solid-app-router";

import { HierarchyList, HierarchyElement } from "./components/panels/Hierarchy";

import CardComposition from "./components/card/CardComposition";
import CardMask from "./components/card/CardMask";

import LayOut from "./components/panels/LayOut";
import TextStyling from "./components/panels/TextStyling";
import SVGStyling from "./components/panels/SVGStyling";

import HighlightStyling from "./components/panels/HighlightStyling";
import BackgroundPanel from "./components/panels/BackgroundPanel";

// import Guides from "./components/viewport/Guides";
import Rulers from "./components/viewport/Rulers";
import Swatches from "./components/panels/Swatches";
import MaskHandle from "./components/viewport/MaskHandle";

import Prompt from "./components/Prompt";

import { array_move, array_remove } from "./helpers/Pure";

import { styled } from "solid-styled-components";

import {
  HeaderPanel,
  LabeledInput,
  FlexRow,
  GridRow,
  Label,
  Button,
  Span,
  LabeledColorPicker,
  FullScreen,
  Overlay,
} from "./components/panels/UI_Components";

function App(props) {
  const { card_id } = useParams();

  const default_types = ["do", "say", "back"];

  let card_ref;

  const getDefaultTextState = () => ({
    position: {
      x: 10,
      y: 12,
    },
    dimensions: {
      width: 80,
      height: 80,
    },
    styles: {
      family: "times",
      size: 10,
      lineHeight: 12,
      spacing: 0,
      color: 0,
      alignmentHorizontal: "flex-start",
      alignmentVertical: "flex-start",
      shadowLeft: 0,
      shadowTop: 0,
      shadowBox: 0,
    },
  });

  const getDefaultModes = () => ({
    choice: 1,
    timed: 1,
  });

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
    deck: {
      background: "#efefef",
      border_radius: "5",
      card_dimensions: {
        width: 55.88507940957915,
        height: 100,
      },
      globals: {},
      elements: {},
      types: {},
    },
    viewport: {
      masked_percentage: 90,
      masked_styling: false,
      selected_element_index: false,
      type_manager: false,
      modes: {
        timed: false,
        choice: false,
      },
      type: default_types[0],
      prompt: false,
      card_size: {},
    },
  });

  window.state = state;
  window.setState = setState;

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

  // state getters and setters

  //    viewport

  const toggleMaskedStyling = (e) => {
    e.stopPropagation();
    setState("viewport", "masked_styling", (bool) => !bool);
  };

  const setMaskPercentage = (percentage) => {
    setState("viewport", "masked_percentage", percentage);
  };

  const toggleTypeManager = async () => {
    setState("viewport", "type_manager", (bool) => !bool);
    /*   const result = await props.openPrompt({
      type: "type_manager",
      position: center,
      data: {
        options: ["delete", "fill", "fill horizontally", "fill vertically"],
      },
    });

    if (!result) return; */
  };

  //  set card modes

  const setModeViewport = (type, bool) => {
    setState("viewport", "modes", type, bool);
    if (type === "choice") changeInstructionText();
  };

  //   deck

  //   deck: general

  const getCardSize = () => ({
    height: window.innerHeight * 0.9,
    width:
      (window.innerHeight * 0.9 * state.deck.card_dimensions.width) /
      state.deck.card_dimensions.height,
  });

  const setCardDimension = (dimension, value) => {
    setState("deck", "card_dimensions", dimension, value);
  };

  const setBackground = (background) =>
    setState("deck", "background", background);

  const addElementToGlobals = (id, element) =>
    setState("deck", "globals", id, element);

  //   deck: instruction

  /* const getLocalElement = (id) =>
    getSelectedType()
      ? getSelectedType().elements.find((element) => element.id === id)
      : null; */

  const getLocalInstruction = () =>
    getSelectedType()
      ? getSelectedType().elements.find(
          (element) => element.type === "instruction"
        )
      : null;

  const getStyles = ({ id, index, highlight }) => {
    const local_element = getLocalElement({ id, index });
    if (!local_element) return {};
    const style_type = highlight ? "highlight_styles" : "styles";
    return {
      ...getGlobalElement(local_element.id)[style_type],
      ...local_element[style_type],
    };
  };

  const setStyle = ({ index, id, type, value, highlight }) => {
    const local_element = getLocalElement({ index, id });
    if (!local_element) return;

    const style_type = highlight ? "highlight_styles" : "styles";

    if (local_element[style_type][type] + 1) {
      // set locally
      setState(
        ...getLocalElementAsArgs({ index, id }),
        style_type,
        type,
        value
      );
    } else {
      if (!local_element.global) {
        console.error(
          "setStyle error: a local element tries to change style-attributes not present",
          { index, id, type, value }
        );
        return;
      }
      // set globally
      setState(...getGlobalElementAsArgs(id), style_type, type, value);
    }
  };

  const changeInstructionText = async () => {
    let type = state.viewport.modes.choice ? "choice" : "normal";
    let current_text = getLocalElement({ id: "instruction" }).content;

    const getRandomLoremIpsum = () =>
      new Promise((resolve) => {
        const findRandomLoremIpsum = () => {
          let random_index = Math.floor(
            Math.random() * lorem_ipsum[type].length
          );
          let random_lorem_ipsum = lorem_ipsum[type][random_index];
          if (random_lorem_ipsum !== current_text) resolve(random_lorem_ipsum);
          else findRandomLoremIpsum();
        };
        findRandomLoremIpsum();
      });

    let random_lorem_ipsum = await getRandomLoremIpsum();

    setState(
      ...getSelectedTypeAsArgs(),
      "elements",
      (element) => element.type === "instruction",
      "content",
      random_lorem_ipsum
    );
  };

  //  deck: type

  const setType = (type) => setState("viewport", "type", type);

  const isTypeSelected = (type) => {
    return state.viewport.type === type;
  };

  const getSelectedType = () => {
    let selected_type = state.deck.types[state.viewport.type];

    if (!selected_type) return undefined;

    return selected_type;
  };

  const getSelectedTypeAsArgs = createMemo(() => {
    return ["deck", "types", state.viewport.type];
  });

  //  deck: type: swatches

  const getSelectedSwatches = (timed = false) => {
    let selected_type = getSelectedType();
    if (!selected_type) return [];

    return selected_type.swatches.map((s) => (timed ? s.timed : s.normal));
  };

  const setSwatch = (index, color) => {
    setState(
      "deck",
      "types",
      state.viewport.type,
      "swatches",
      index,
      !state.viewport.masked_styling ? "normal" : "timed",
      color
    );
  };

  const addSwatch = (index, color) => {
    setState(
      "deck",
      "types",
      state.viewport.type,
      "swatches",
      state.deck.types[state.viewport.type].swatches.length,
      {
        normal: "#000000",
        timed: "#ffffff",
      }
    );
  };

  //      deck: type: elements

  const setSelectedElementIndex = (index) => {
    setState("viewport", "selected_element_index", index);
  };

  const getLocalElement = ({ index, id }) => {
    if (id) {
      index = getSelectedType().elements.findIndex((e) => e.id === id);
    }
    if (index + 1) return getSelectedType().elements[index];
    return false;
  };

  const getLocalElementAsArgs = ({ index, id }) => {
    if (id) {
      index = getSelectedType().elements.findIndex((e) => e.id === id);
    }
    if (index + 1) return [...getSelectedTypeAsArgs(), "elements", index];

    console.log("getLocalElementAsArgs", index, id);
    return [];
  };

  const getGlobalElementAsArgs = (id) => ["deck", "globals", id];
  const getGlobalElement = (id) => state.deck.globals[id];

  const getElementsOfSelectedType = (from_where) => {
    let selected_type = getSelectedType();
    if (!selected_type) return [];

    return selected_type.elements;
  };

  const getSelectedElement = createMemo(() => {
    if (
      state.viewport.selected_element_index !== 0 &&
      !state.viewport.selected_element_index
    ) {
      return false;
    }
    let selected_type = getSelectedType();
    if (!selected_type) return false;
    return selected_type.elements[state.viewport.selected_element_index];
  });

  const selectedElementIsType = (type) =>
    getSelectedElement() &&
    getSelectedElement().type &&
    getSelectedElement().type.indexOf(type) != -1;

  const elementIsVisible = (element) => {
    let modes;
    if (element.global) {
      modes = state.deck.globals[element.id].modes;
    } else {
      modes = element.modes;
    }

    // NO TIMER — NO CHOICE
    if (!state.viewport.modes.timed && !state.viewport.modes.choice) {
      if (
        (modes.choice === 1 || modes.choice === 0) &&
        (modes.timed === 1 || modes.timed === 0)
      ) {
        return true;
      } else {
        return false;
      }
    }

    // YES TIMER — NO CHOICE
    if (state.viewport.modes.timed && !state.viewport.modes.choice) {
      if (
        (modes.timed === 1 || modes.timed === 2) &&
        (modes.choice === 1 || modes.choice === 0)
      ) {
        return true;
      }
    }

    // NO TIMER — YES CHOICE
    if (!state.viewport.modes.timed && state.viewport.modes.choice) {
      if (
        (modes.timed === 1 || modes.timed === 0) &&
        (modes.choice === 1 || modes.choice === 2)
      ) {
        return true;
      }
    }

    // YES TIMER — YES CHOICE
    if (state.viewport.modes.timed && state.viewport.modes.choice) {
      if (
        (modes.timed === 1 || modes.timed === 2) &&
        (modes.choice === 1 || modes.choice === 2)
      ) {
        return true;
      }
    }

    return false;
  };

  const resizeElement = ({ index, dimensions, position }) => {
    const element = getLocalElement({ index });
    if (element.global) {
      setState(...getGlobalElementAsArgs(element.id), "position", position);
      setState(...getGlobalElementAsArgs(element.id), "dimensions", dimensions);
    } else {
      setState(...getLocalElementAsArgs({ index }), "position", position);
      setState(...getLocalElementAsArgs({ index }), "dimensions", dimensions);
    }
  };

  const translateElement = ({ index, delta }) => {
    const element = getLocalElement({ index });
    if (element.global) {
      setState("deck", "globals", element.id, "position", (position) => ({
        x: position.x + (delta.x / getCardSize().width) * 100,
        y: position.y + (delta.y / getCardSize().height) * 100,
      }));
    } else {
      setState(...getLocalElementAsArgs({ index }), "position", (position) => ({
        x: position.x + (delta.x / getCardSize().width) * 100,
        y: position.y + (delta.y / getCardSize().height) * 100,
      }));
    }
  };

  const setLockedElement = (index, bool) => {
    if (state.viewport.selected_element_index === index && bool)
      setSelectedElementIndex(false);
    if (!bool) setSelectedElementIndex(index);
    setState(...getLocalElementAsArgs({ index }), "locked", bool);
  };

  const removeElement = (index) => {
    setState(
      ...getSelectedTypeAsArgs(),
      "elements",
      array_remove(getElementsOfSelectedType(), index)
    );
  };

  const changeOrderElement = (from_index, to_index) => {
    setState(
      ...getSelectedTypeAsArgs(),
      "elements",
      array_move(getElementsOfSelectedType(), from_index, to_index)
    );
    setSelectedElementIndex(to_index);
  };

  const toggleModeElement = (index, type) => {
    setState(
      ...getLocalElementAsArgs({ index }),
      "modes",
      type,
      (mode) => (mode + 1) % 3
    );
  };

  const processSVG = async (file) => {
    const findStyle = (svg) =>
      new Promise((resolve) => {
        const iterate = (el) => {
          if (!el.children) return;
          [...el.children].forEach((el) => {
            if (el.localName === "style") {
              resolve(el.childNodes[0].data);
            } else {
              iterate(el.children);
            }
          });
        };
        iterate(svg);
        resolve(false);
      });

    const container = document.createElement("div");
    container.innerHTML = file.result;
    let svg_dom = container.children[0];

    const style_text = await findStyle(svg_dom);
    if (!style_text) {
      console.error("could not find style");
      return;
    }

    let duplicate_check = [];
    let styles = style_text
      .match(/\.[^{,]+/gs)
      .map((c) => c.slice(1, c.length))
      .filter((c) => {
        if (duplicate_check.indexOf(c) != -1) return false;
        duplicate_check.push(c);
        return true;
      })
      .map((c) => ({ old_name: c }));

    styles = styles.map((c) => {
      let regex = new RegExp(c.old_name + "(?![0-9])[^{]*[^}]*", "g");
      let style = {};
      [...style_text.matchAll(regex)].forEach((string) => {
        string = string[0].split("{")[1];
        let split_string = string.split(";");
        split_string.forEach((key_value) => {
          const [key, value] = key_value.split(":");
          if (!key || !value) return;
          style[key] = value;
        });
      });
      return { ...c, new_name: uniqid(), style };
    });

    // let renamed_svg = file.result;
    let svg = file.result;

    styles.forEach((s) => {
      let regex = `${s.old_name}(?![0-9])`;
      svg = svg.replace(new RegExp(regex, "g"), s.new_name);
    });

    styles = Object.fromEntries(styles.map((s) => [s.new_name, s.style]));

    return { svg, styles };
  };

  // window.setState = setState;

  const setStyleSVG = ({ key, type, value, highlight }) => {
    setState(
      ...getLocalElementAsArgs({
        index: state.viewport.selected_element_index,
      }),
      "styles",
      key,
      type,
      value
    );
  };

  // general functions

  const fetchDeck = async (card_id) => {
    try {
      let result = await fetch(`${props.urls.fetch}/api/card/get/${card_id}`);
      let deck = await result.json();
      if (!deck) return false;
      setState("deck", deck);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const saveDeck = async () => {
    try {
      let result = await fetch(`${props.urls.fetch}/api/card/save/${card_id}`, {
        method: "POST",
        mode: "cors",
        cache: "no-cache",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
        referrerPolicy: "no-referrer",
        body: JSON.stringify(state.deck),
      });
      result = await result.json();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const upload = (e) => {
    e.preventDefault();
    e.preventDefault();

    const file = e.dataTransfer.files[0];

    if (!(file && file["type"].split("/")[0] === "image")) return;

    if (!file) return;
    const reader = new FileReader();
    const splitted_name = file.name.split(".");
    const file_is_svg =
      splitted_name[splitted_name.length - 1].toLowerCase() === "svg";

    reader.onload = async function ({ target }) {
      if (file_is_svg) {
        const { svg, styles } = await processSVG(target);
        setState(
          ...getLocalElementAsArgs({
            index: getSelectedType().elements.length,
          }),
          {
            type: "svg",
            modes: getDefaultModes(),
            position: {
              x: 0,
              y: 0,
            },
            dimensions: {
              width: 100,
              height: 100,
            },
            svg,
            styles,
            content: splitted_name.slice(0, splitted_name.length - 1).join("."),
          }
        );
      }
    };
    if (!file_is_svg) reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  //    styled components

  const LongPanel = styled("div")`
    bottom: 0px;
    right: 0px;
    background: white;
    text-align: left;
    z-index: 5;
    text-align: left;
    font-size: 8pt;
    /* width: 250px; */
    /* height: 100vh; */
    overflow: hidden;
    flex-direction: column;
    border-left: 3px solid white;
    display: flex;
    & * {
      font-size: 8pt;
    }
  `;
  const BottomPanel = styled("div")`
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 0px;
    width: 100%;
  `;

  const App = styled("div")`
    text-align: center;
    height: 100vh;
    width: 100vw;
    position: absolute;
    overflow: hidden;
    flex-direction: row;
    /* background: lightgrey; */
    display: flex;
    flex: 1;
  `;

  const CardContainer = styled("div")`
    position: absolute;
    transform: translate(-50%, -50%);
    position: relative;
    left: 50%;
    top: 50%;
    background: white;
    box-shadow: 0px 0px 50px lightgrey;
    z-index: 5;
  `;

  const Viewport = styled("div")`
    flex: 1;
    position: relative;
  `;

  const createNewCard = () => {
    const instruction = {
      ...getDefaultTextState(),
      modes: getDefaultModes(),
      hide_modes: true,
      highlight_styles: {
        family: "times",
        background: 0,
        alignmentHorizontal: "right",
        marginHorizontal: 5,
        marginVertical: 5,
        paddingHorizontal: 5,
        paddingVertical: 5,
        alignmentVertical: "flex-start",
        borderRadius: 0,
        borderWidth: 0,
        borderColor: 0,
        textShadowLeft: 0,
        textShadowTop: 0,
        textShadowBox: 0,
        boxShadowLeft: 0,
        boxShadowTop: 0,
        boxShadowBox: 0,
      },
    };

    addElementToGlobals("instruction", instruction);

    const countdown = {
      modes: {
        choice: 1,
        timed: 2,
      },
      hide_modes: true,
      position: {
        x: 25,
        y: 90,
      },
      dimensions: {
        width: 50,
        height: 10,
      },
      styles: {
        family: "times",
        size: 10,
        lineHeight: 12,
        spacing: 0,
        color: 0,
        alignmentHorizontal: "center",
        alignmentVertical: "center",
        shadowLeft: 0,
        shadowTop: 0,
        shadowBox: 0,
      },
    };

    addElementToGlobals("countdown", countdown);

    let types = Object.fromEntries(
      default_types.map((type) => [
        type,
        {
          swatches: [
            { normal: "#000000", timed: "#ffffff" },
            { normal: "#CCCCCC", timed: "#CCCCCC" },
            { normal: "#ffffff", timed: "#000000" },
          ],
          elements:
            type !== "back"
              ? [
                  {
                    id: "instruction",
                    type: "instruction",
                    global: true,
                    styles: {
                      color: 0,
                    },
                    highlight_styles: {
                      background: 1,
                      color: 2,
                    },
                    content:
                      lorem_ipsum["normal"][
                        Math.floor(Math.random() * lorem_ipsum["normal"].length)
                      ],
                  },
                  {
                    id: "countdown",
                    type: "countdown",
                    global: true,
                    styles: {
                      color: 0,
                    },
                    content: 30 * (state.viewport.masked_percentage / 100),
                  },
                ]
              : [],
        },
      ])
    );
    setState("deck", "types", types);
  };

  const openPrompt = ({ type, data, position }) =>
    new Promise((_resolve) => {
      const resolve = (data) => {
        setState("viewport", "prompt", false);
        _resolve(data);
      };

      setState("viewport", "prompt", {
        type,
        data,
        position,
        resolve,
      });
    });

  onMount(async () => {
    window.addEventListener("resize", () => {
      setState("viewport", "card_size", getCardSize());
    });
    setState("viewport", "card_size", getCardSize());
    let result = await fetchDeck(card_id);
    if (result) return;
    createNewCard();
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
                <For each={Object.keys(state.deck.types)}>
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
        style={{ background: state.deck.background }}
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
            card_dim={state.deck.card_dimensions}
            guides={state.guides}
            shouldSnap={state.bools.shouldSnap}
          ></Rulers>
          <Show when={state.viewport.modes.timed}>
            <MaskHandle
              percentage={state.viewport.masked_percentage}
              onTranslate={setMaskPercentage}
            ></MaskHandle>
          </Show>

          <CardContainer
            card_dimensions={JSON.stringify(state.deck.card_dimensions)}
            ref={card_ref}
            style={{
              width: `calc(90vh * ${
                state.deck.card_dimensions.width /
                state.deck.card_dimensions.height
              })`,
              height: "90vh",
              "border-radius": state.deck.border_radius * 0.9 + "vh",
            }}
          >
            <div className="viewport">
              <CardComposition
                elements={getElementsOfSelectedType("card")}
                swatches={getSelectedSwatches()}
                globals={state.deck.globals}
                getStyles={getStyles}
                //
                card_dimensions={state.deck.card_dimensions}
                card_size={state.viewport.card_size}
                guides={state.guides}
                shouldSnap={state.bools.shouldSnap}
                shiftPressed={state.bools.isShiftPressed}
                altPressed={state.bools.isAltPressed}
                //
                elementIsVisible={elementIsVisible}
                selected_element_index={state.viewport.selected_element_index}
                selectElement={setSelectedElementIndex}
                translateElement={translateElement}
                resizeElement={resizeElement}
                //
                openPrompt={openPrompt}
              ></CardComposition>

              <Show when={state.viewport.modes.timed}>
                <CardMask percentage={state.viewport.masked_percentage}>
                  <CardComposition
                    masked={true}
                    elements={getElementsOfSelectedType("card")}
                    swatches={getSelectedSwatches(true)}
                    globals={state.deck.globals}
                    //
                    card_dimensions={state.deck.card_dimensions}
                    card_size={state.viewport.card_size}
                    elementIsVisible={elementIsVisible}
                    //
                    openPrompt={openPrompt}
                  ></CardComposition>
                </CardMask>
              </Show>
            </div>
            {/* {!state.bools.areGuidesHidden ? (
              <Guides
                card_dim={state.deck.card_dimensions}
                guides={state.guides}
                shouldSnap={state.bools.shouldSnap}
              ></Guides>
            ) : null} */}
          </CardContainer>

          <BottomPanel
            setType={setType}
            typeInFocus={state.viewport.type}
          ></BottomPanel>
        </Viewport>
        <LongPanel className="right_panel">
          <FlexRow
            style={{
              "padding-bottom": "0px",
              "justify-content": "flex-end",
              height: "25px",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                flex: 1,
                "text-align": "left",
                "margin-left": "6px",
                "align-self": "center",
              }}
            >
              🃏 card editor for <i>{card_id}</i>
            </span>
            <Button onClick={toggleTypeManager}>manage types</Button>
            <Button onClick={saveDeck}>overview</Button>
            <Button onClick={createNewCard}>new card</Button>
            <Button onClick={saveDeck}>save card</Button>
          </FlexRow>
          <LongPanel
            style={{
              "flex-direction": "row",
              overflow: "hidden",
              "margin-top": "6px",
              height: "100%",
            }}
          >
            <LongPanel style={{ width: "300px", overflow: "auto" }}>
              <HeaderPanel label="Card Type" visible={true}>
                <GridRow
                  style={{
                    "padding-top": "10px",
                  }}
                >
                  <Label>type</Label>
                  <GridRow
                    style={{
                      "grid-column": "span 3",
                      "grid-template-columns": "repeat(3, 1fr)",
                      "row-gap": "6px",
                      padding: "0px",
                    }}
                  >
                    <For each={Object.keys(state.deck.types)}>
                      {(type) => (
                        <Button
                          className={isTypeSelected(type) ? "focus" : ""}
                          style={{ flex: 1 }}
                          onClick={() => setType(type)}
                        >
                          {type}
                        </Button>
                      )}
                    </For>
                  </GridRow>
                </GridRow>
                <Show when={state.viewport.type !== "back"}>
                  <GridRow style={{ "margin-bottom": "6px" }}>
                    <LabeledInput
                      label="choice "
                      type="checkbox"
                      checked={state.viewport.modes.choice}
                      onChange={(checked) => setModeViewport("choice", checked)}
                      style={{ padding: "0px" }}
                    ></LabeledInput>
                    <LabeledInput
                      label="timed"
                      type="checkbox"
                      checked={state.viewport.modes.timed}
                      onChange={(checked) => setModeViewport("timed", checked)}
                      style={{ padding: "0px" }}
                    ></LabeledInput>

                    <Button
                      style={{ flex: 1 }}
                      onClick={() => changeInstructionText()}
                      style={{ "grid-column": "span 2" }}
                    >
                      random instruction
                    </Button>
                  </GridRow>
                </Show>
              </HeaderPanel>
              <Swatches
                // swatches={getSelectedSwatches()}
                swatches={getSelectedSwatches(state.viewport.masked_styling)}
                setSwatch={setSwatch}
                addSwatch={addSwatch}
                timed={state.viewport.modes.timed}
                masked_styling={state.viewport.masked_styling}
                toggleMaskedStyling={(e) => toggleMaskedStyling(e)}
                hide_modes={state.viewport.type === "back"}
              ></Swatches>

              <Show when={selectedElementIsType("svg")}>
                <SVGStyling
                  header="Custom Text Styling"
                  styles={getSelectedElement().styles}
                  swatches={getSelectedSwatches(state.viewport.masked_styling)}
                  setStyleSVG={setStyleSVG}
                  masked_styling={state.viewport.masked_styling}
                  toggleMaskedStyling={(e) => toggleMaskedStyling(e)}
                  hide_modes={state.viewport.type === "back"}
                ></SVGStyling>
              </Show>
              <Show
                when={
                  getSelectedType() && getLocalElement({ id: "instruction" })
                }
              >
                <TextStyling
                  header="Instruction Styling"
                  styles={getStyles({ id: "instruction" })}
                  swatches={getSelectedSwatches(state.viewport.masked_styling)}
                  onChange={(type, value) =>
                    setStyle({ id: "instruction", type, value })
                  }
                  masked_styling={state.viewport.masked_styling}
                  toggleMaskedStyling={(e) => toggleMaskedStyling(e)}
                  visible={true}
                  hide_modes={state.viewport.type === "back"}
                ></TextStyling>
                <HighlightStyling
                  styles={getStyles({ id: "instruction", highlight: true })}
                  swatches={getSelectedSwatches(state.viewport.masked_styling)}
                  // onChange={(type, value) => setHighlightStyle({ type, value })}
                  onChange={(type, value) =>
                    setStyle({
                      id: "instruction",
                      type,
                      value,
                      highlight: true,
                    })
                  }
                  masked_styling={state.viewport.masked_styling}
                  toggleMaskedStyling={(e) => toggleMaskedStyling(e)}
                  visible={true}
                  hide_modes={state.viewport.type === "back"}
                ></HighlightStyling>
                <TextStyling
                  header="Countdown Styling"
                  styles={getStyles({ id: "countdown" })}
                  swatches={getSelectedSwatches(state.viewport.masked_styling)}
                  onChange={(type, value) =>
                    setStyle({
                      id: "countdown",
                      type,
                      value,
                    })
                  }
                  masked_styling={state.viewport.masked_styling}
                  toggleMaskedStyling={(e) => toggleMaskedStyling(e)}
                  visible={false}
                  hide_modes={state.viewport.type === "back"}
                ></TextStyling>
              </Show>

              <Show when={selectedElementIsType("text")}>
                <TextStyling
                  header="Custom Text Styling"
                  styles={getSelectedElement().styles}
                  swatches={getSelectedSwatches(state.viewport.masked_styling)}
                  onChange={(type, value) =>
                    setStyle({
                      index: state.viewport.selected_element_index,
                      type,
                      value,
                    })
                  }
                  hide_modes={state.viewport.type === "back"}
                ></TextStyling>
              </Show>

              <HeaderPanel label="Card Styles" visible={false}>
                <FlexRow>
                  <LabeledColorPicker
                    label="background"
                    value={state.deck.background}
                    onChange={setBackground}
                    swatches={getSelectedSwatches()}
                  ></LabeledColorPicker>

                  <LabeledInput
                    label="ratio"
                    value={parseInt(state.deck.card_dimensions.width)}
                    onChange={(value) => setCardDimension("width", value)}
                  ></LabeledInput>
                </FlexRow>
              </HeaderPanel>
            </LongPanel>
            <LongPanel
              style={{
                width: "300px",
                overflow: "auto",
                "border-left": "1px solid var(--light)",
              }}
            >
              <HierarchyList
                elements={getElementsOfSelectedType()}
                changeOrderElement={changeOrderElement}
                elementIsVisible={elementIsVisible}
                removeElement={props.removeElement}
                setLockedElement={setLockedElement}
                toggleModeElement={toggleModeElement}
                selectElement={setSelectedElementIndex}
                selected_element_index={state.viewport.selected_element_index}
                card_type={state.viewport.type}
                hide_modes={state.viewport.type === "back"}
              ></HierarchyList>
            </LongPanel>
          </LongPanel>
        </LongPanel>
      </App>
    </>
  );
}

export default App;
