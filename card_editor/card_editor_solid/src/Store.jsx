import { createStore, produce } from "solid-js/store";
import { createContext, useContext } from "solid-js";
import { array_move, array_remove } from "./helpers/Pure";
import uniqid from "uniqid";
// import check from "./helpers/check";
const default_types = ["do", "say", "back"];

const StoreContext = createContext();

export function Provider(props) {
  const check = (bool) => !(!bool && bool !== 0);

  const [state, setState] = createStore({
    card_id: null,
    pressed_keys: [],
    instruction: {},
    bools: {
      shouldSnap: false,
      isShiftPressed: false,
      isAltPressed: false,
      areGuidesLocked: false,
      areGuidesHidden: false,
    },
    guides: [],
    design: {
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
      timer_percentage: 90,
      masked_styling: false,
      selected_element_index: false,
      type_manager: false,
      modes: {
        timed: false,
        choice: false,
      },
      type: default_types[0],
      prompt: false,
      card_size: {
        width: null,
        height: null,
      },
    },
  });

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

  const getStateFromArgs = (args) =>
    new Promise((resolve) => {
      const iterate = (nested_state, args) => {
        const arg = args.shift();
        if (args.length === 0) {
          resolve(nested_state[arg]);
        } else iterate(nested_state[arg], args);
      };
      iterate(state, [...args]);
    });

  let state_history = [];

  const archiveStateChanges = (state_changes) => {
    state_history.push(state_changes);
    if (state_history.length > 1000) {
      state_history.shift();
    }
  };

  const revertStateChange = () => {
    if (state_history.length === 0) return;
    let last_state_changes = state_history.pop();
    last_state_changes.forEach(async (state_change) => {
      if (state_change.old_value === undefined) {
        let last_arg = state_change.args.pop();
        let parent_is_array = typeof last_arg === "number";
        let parent_state = await getStateFromArgs(state_change.args);
        if (parent_is_array)
          setState(...state_change.args, array_remove(parent_state, last_arg));
        else setState(...state_change.args, last_arg, undefined);
      } else {
        setState(...state_change.args, state_change.old_value);
      }
    });
  };

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

  const setCardId = (card_id) => setState("card_id", card_id);

  //    viewport

  const toggleMaskedStyling = (e) => {
    e.stopPropagation();
    setState("viewport", "masked_styling", (bool) => !bool);
  };

  const setTimerPercentage = (percentage) => {
    setState("viewport", "timer_percentage", percentage);
  };

  const getTimerPercentage = (percentage) => state.viewport.timer_percentage;

  const toggleTypeManager = () =>
    setState("viewport", "type_manager", (bool) => !bool);

  const toggleModeViewport = (type) => {
    setState("viewport", "modes", type, (bool) => !bool);
    if (type === "choice") changeInstructionText();
  };

  // const getTimer = () => state.viewport.timer;

  // instruction:   an instruction constructed from the modes
  //                which is used as an input for the card-renderer

  const updateInstruction = () => {
    let instruction = {
      type: state.viewport.type,
    };
  };

  //   design

  //   design: general

  const getCardSize = () => state.viewport.card_size;

  const convert = (value, horizontal = false) => {
    return !horizontal
      ? (parseFloat(value) * getCardSize().height) / 400
      : parseFloat(value) * getCardSize().width;
  };

  const updateCardSize = () =>
    setState("viewport", "card_size", calculateCardSize());

  const calculateCardSize = () => ({
    height: window.innerHeight * 0.9,
    width:
      (window.innerHeight * 0.9 * state.design.card_dimensions.width) /
      state.design.card_dimensions.height,
  });

  const setCardDimension = (dimension, value) => {
    archiveStateChanges([
      setStateArchive("design", "card_dimensions", dimension, value),
    ]);
  };

  const setBackground = (background) =>
    setState("design", "background", background);

  const addElementToGlobals = (id, element) =>
    setState("design", "globals", id, element);

  //  design: type

  const setType = (type) => setState("viewport", "type", type);

  const isTypeSelected = (type) => {
    return state.viewport.type === type;
  };

  const getType = (type) => {
    return state.design.types[type];
  };

  const getSelectedType = () => {
    let selected_type = state.design.types[state.viewport.type];
    if (!selected_type) return undefined;
    return selected_type;
  };

  const getSelectedTypeAsArgs = () => ["design", "types", state.viewport.type];

  //  design: type: swatches

  const getSelectedSwatches = (timed = false) => {
    let selected_type = getSelectedType();
    if (!selected_type) return [];

    return selected_type.swatches.map((s) => (timed ? s.timed : s.normal));
  };

  const setSwatch = (index, color) =>
    setStateArchive(
      "design",
      "types",
      state.viewport.type,
      "swatches",
      index,
      !state.viewport.masked_styling ? "normal" : "timed",
      color
    );

  const addSwatch = (index, color) => {
    setState(
      "design",
      "types",
      state.viewport.type,
      "swatches",
      state.design.types[state.viewport.type].swatches.length,
      {
        normal: "#000000",
        timed: "#ffffff",
      }
    );
  };

  //      design: type: elements

  const setSelectedElementIndex = (index) => {
    setState("viewport", "selected_element_index", index);
  };

  //

  const getLocalElement = ({ index, id, type }) => {
    if (!type) {
      type = getSelectedType();
    } else {
      type = getType(type);
    }
    if (!type) return false;
    if (id) {
      return type.elements.find((e) => e.id === id);
    } else {
      return type.elements[index];
    }
  };

  const getLocalElementAsArgs = ({ index, id }) => {
    if (id) index = getSelectedType().elements.findIndex((e) => e.id === id);
    if (check(index)) return [...getSelectedTypeAsArgs(), "elements", index];
    return [];
  };

  const getGlobalElement = (id) => state.design.globals[id];
  const getGlobalElementAsArgs = (id) => ["design", "globals", id];

  const getLocalElements = (from_where) => {
    let selected_type = getSelectedType();
    if (!selected_type) return [];
    return selected_type.elements;
  };

  const getSelectedElement = () => {
    if (!check(state.viewport.selected_element_index)) return false;
    let selected_type = getSelectedType();
    if (!selected_type) return false;
    return selected_type.elements[state.viewport.selected_element_index];
  };

  const isSelectedElementOfType = (type) => {
    return (
      getSelectedElement() &&
      getSelectedElement().type &&
      getSelectedElement().type.indexOf(type) != -1
    );
  };

  /*   const changeOrderElement = (from_index, to_index) => {
    setState(
      produce((_state) => {
        let elements = _state.design.types[_state.viewport.type].elements;
        _state.design.types[_state.viewport.type].elements = array_move(
          elements,
          from_index,
          to_index
        );
      })
    );
    setSelectedElementIndex(to_index);
  }; */

  const changeOrderElement = (from_index, to_index) => {
    setState(
      ...getSelectedTypeAsArgs(),
      "elements",
      array_move(getLocalElements(), from_index, to_index)
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

  const setStateArchive = function (v) {
    let args = Object.values(arguments);
    let new_value = args.pop();
    let old_value;
    setState(...args, (v) => {
      if (v) old_value = JSON.parse(JSON.stringify(v));
      else old_value = undefined;
      return new_value;
    });
    return { args, new_value, old_value };
  };

  const translateElement = ({ index, delta }) => {
    const element = getLocalElement({ index });
    let args;
    let old_value, new_value;
    if (element.global) {
      args = ["design", "globals", element.id, "position"];
    } else {
      args = [...getLocalElementAsArgs({ index }), "position"];
    }

    setState(...args, (position) => {
      old_value = { ...position };
      new_value = {
        x: position.x + (delta.x / getCardSize().width) * 100,
        y: position.y + (delta.y / getCardSize().height) * 100,
      };
      return new_value;
    });

    return [{ old_value, new_value, args }];
  };

  const resizeElement = ({ index, dimensions, position }) => {
    const element = getLocalElement({ index });
    let args;
    if (element.global) {
      args = [...getGlobalElementAsArgs(element.id)];
    } else {
      args = [...getLocalElementAsArgs({ index })];
    }

    const archived_position = setStateArchive(...args, "position", position);
    const archived_dimensions = setStateArchive(
      ...args,
      "dimensions",
      dimensions
    );

    return [archived_position, archived_dimensions];
  };

  const lockElement = (index, bool) => {
    if (state.viewport.selected_element_index === index && bool)
      setSelectedElementIndex(false);
    if (!bool) setSelectedElementIndex(index);
    setState(...getLocalElementAsArgs({ index }), "locked", bool);
  };

  const removeElement = (index) => {
    setState(
      ...getSelectedTypeAsArgs(),
      "elements",
      array_remove(getLocalElements(), index)
    );
  };

  const getDimensions = ({ element, type }) => {
    return element.global
      ? state.design.globals[element.id].dimensions
      : element.dimensions;
  };

  const getPosition = ({ element, type }) => {
    return element.global
      ? state.design.globals[element.id].positions
      : element.positions;
  };

  const getStyles = ({ id, index, type, element, highlight }) => {
    const local_element = element
      ? element
      : getLocalElement({ id, index, type });
    if (!local_element) return {};

    const style_type = highlight ? "highlight_styles" : "styles";

    if (local_element.global) {
      let global_style = getGlobalElement(local_element.id)[style_type];
      return {
        ...global_style,
        ...local_element[style_type],
      };
    }

    return {
      ...local_element[style_type],
    };
  };

  const getTextStyles = ({ element, swatches }) => {
    let styles = getStyles({ element });
    return {
      width: "100%",
      height: "100%",
      display: "flex",
      "flex-direction": "column",
      "pointer-events": "all",
      // zIndex: props.zIndex,
      "justify-content": styles.alignmentVertical,
      "align-items": styles.alignmentHorizontal,
      "font-size": convert(styles.size) + "pt",
      "font-family": styles.family,
      "letter-spacing": convert(styles.spacing, true),
      "line-height": `${convert(styles.lineHeight)}pt`,
      color: swatches[styles.color],
      "text-shadow":
        styles.shadowLeft || styles.shadowLeft || styles.shadowBlur
          ? `${styles.shadowLeft ? convert(styles.shadowLeft) : 0}px ${
              styles.shadowTop ? convert(styles.shadowTop) : 0
            }px ${styles.shadowBlur ? convert(styles.shadowBlur) : 0}px ${
              styles.shadowColor ? swatches[styles.shadowColor] : "black"
            }`
          : null,
    };
  };

  const getHighlightStyles = ({ element, swatches }) => {
    let styles = getStyles({ element, highlight: true });

    return {
      "font-family": styles.family,
      color: swatches[styles.color],
      background: swatches[styles.background],
      display: "inline-block",
      "box-sizing": "border-box",
      "align-items": styles.alignmentHorizontal,
      "padding-left": convert(styles.paddingHorizontal) + "px",
      "padding-right": convert(styles.paddingHorizontal) + "px",
      "padding-top": convert(styles.paddingVertical) + "px",
      "padding-bottom": convert(styles.paddingVertical) + "px",
      "margin-left": convert(styles.marginHorizontal) + "px",
      "margin-right": convert(styles.marginHorizontal) + "px",
      "margin-top": convert(styles.marginVertical) + "px",
      "margin-bottom": convert(styles.marginVertical) + "px",
      "border-radius": convert(styles.borderRadius) + "px",
      "border-width": styles.borderWidth + "px",
      "border-color": swatches[styles.borderColor],
      "border-style": "solid",
      "box-shadow":
        styles &&
        (styles.boxShadowLeft || styles.boxShadowLeft || styles.boxShadowBlur)
          ? `${styles.boxShadowLeft ? convert(styles.boxShadowLeft) : 0}px ${
              styles.boxShadowTop ? convert(styles.boxShadowTop) : 0
            }px ${styles.boxShadowBlur ? convert(styles.boxShadowBlur) : 0}px ${
              styles.boxShadowColor ? swatches[styles.boxShadowColor] : "black"
            }`
          : null,
      "text-shadow":
        styles &&
        (styles.textShadowLeft ||
          styles.textShadowLeft ||
          styles.textShadowBlur)
          ? `${styles.textShadowLeft ? convert(styles.textShadowLeft) : 0}px ${
              styles.textShadowTop ? convert(styles.textShadowTop) : 0
            }px ${
              styles.textShadowBlur ? convert(styles.textShadowBlur) : 0
            }px ${
              styles.textShadowColor
                ? swatches[styles.textShadowColor]
                : "black"
            }`
          : null,
    };
  };

  const setStyle = ({ index, id, type, value, highlight }) => {
    const local_element = getLocalElement({ index, id });
    if (!local_element) return;

    let args;
    const style_type = highlight ? "highlight_styles" : "styles";

    if (check(local_element[style_type][type])) {
      args = [...getLocalElementAsArgs({ index, id }), style_type, type, value];
    } else {
      if (!local_element.global) {
        console.error({ index, id, type, value });
        return;
      }
      args = [...getGlobalElementAsArgs(id), style_type, type, value];
    }

    archiveStateChanges([setStateArchive(...args)]);
  };

  const setSVGStyle = ({ key, type, value, highlight }) => {
    archiveStateChanges([
      setStateArchive(
        ...getLocalElementAsArgs({
          index: state.viewport.selected_element_index,
        }),
        "styles",
        key,
        type,
        value
      ),
    ]);
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

  // general functions

  const setDeck = (design) => setState("design", design);

  const addElement = (element) => {
    archiveStateChanges([
      setStateArchive(
        ...getLocalElementAsArgs({ index: getLocalElements().length }),
        element
      ),
    ]);
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
        const index = getSelectedType().elements.length;
        addElement({
          type: "svg",
          modes: getDefaultModes(),
          position: {
            x: 0,
            y: 0,
          },
          // TODO : replace with width / height conform to ratio svg viewbox
          dimensions: {
            width: 100,
            height: 100,
          },
          svg,
          styles,
          content: splitted_name.slice(0, splitted_name.length - 1).join("."),
        });
        setSelectedElementIndex(index);
      }
    };
    if (!file_is_svg) reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  const processSVG = async (file) => {
    // TODO:  replace findStyle with a regex for the style-tags
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

    let svg = file.result;

    styles.forEach((s) => {
      let regex = `${s.old_name}(?![0-9])`;
      svg = svg.replace(new RegExp(regex, "g"), s.new_name);
    });

    styles = Object.fromEntries(styles.map((s) => [s.new_name, s.style]));

    return { svg, styles };
  };

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
                    content: 30 * (state.viewport.timer_percentage / 100),
                  },
                ]
              : [],
        },
      ])
    );
    setState("design", "types", types);
    setState("design", "modes", ["choice", "timed"]);

    updateInstruction();
  };

  // gui

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

  let actions = {
    state,
    setCardId,
    toggleMaskedStyling,
    setTimerPercentage,
    getTimerPercentage,
    toggleTypeManager,
    toggleModeViewport,
    updateCardSize,
    getCardSize,
    setCardDimension,
    setBackground,
    addElementToGlobals,
    setType,
    isTypeSelected,
    getType,
    getSelectedType,
    getSelectedSwatches,
    setSwatch,
    addSwatch,
    getLocalElements,
    getLocalElement,
    setSelectedElementIndex,
    getSelectedElement,
    isSelectedElementOfType,
    changeOrderElement,
    toggleModeElement,
    setStateArchive,
    getPosition,
    getDimensions,
    translateElement,
    resizeElement,
    lockElement,
    removeElement,
    getTextStyles,
    getHighlightStyles,
    getStyles,
    setStyle,
    setSVGStyle,
    changeInstructionText,
    setDeck,
    addElement,
    upload,
    createNewCard,
    openPrompt,
    revertStateChange,
    archiveStateChanges,
  };

  let store = [state, actions];

  return (
    <StoreContext.Provider value={store}>
      {props.children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
