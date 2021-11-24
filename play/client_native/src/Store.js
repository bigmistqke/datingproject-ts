import React, { createContext, useState, useRef, useEffect, useCallback } from 'react'
import { Dimensions } from 'react-native';
import createStore from './createStore';
const StoreContext = createContext();


export function Provider(props) {



  let [state, setStore, ref] = createStore(useState({
    ids: {
      game: null,
      player: null,
      role: null,
      room: null
    },

    instructions: null,
    design: null,
    received_instruction_ids: [],
    bools: {
      isInitialized: false,
    },
    viewport: {
      timer: null,
      card_size: {
        height: null,
        width: null
      },
    }
  }));

  /* let unconfirmed_messages = useRef([]).current;
  let received_instruction_ids = useRef([]).current;
 */

  const setDesign = (design) => {

    setStore("design", design);
  };

  useEffect(() => {
    console.log("STATE DESIGN IS UPDATED!!!", state);
    if (!state.design) return;
    updateCardSize();
  }, [state.design])

  const setInstructions = (instructions) => setStore("instructions", instructions);

  const setIds = (ids) => setStore("ids", ids);

  const removeInstruction = (instruction_id) =>
    setStore("instructions", i => i.instruction_id !== instruction_id)


  const removeFromPrevInstructionIds = (instruction_id) => {
    setStore(
      "instructions",
      i =>
        i.prev_instruction_ids &&
        i.prev_instruction_ids.indexOf(instruction_id) !== -1,
      "prev_instruction_ids",
      i => i !== instruction_id
    )
  }
  /* s */

  const getCardSize = () => ref.viewport.card_size;

  const getElements = (type) => ref.design && ref.design.types[type] ?
    ref.design.types[type].elements :
    []

  const convert = (value, horizontal = false) => {
    return !horizontal
      ? (parseFloat(value) * getCardSize().height) / 250
      : parseFloat(value) * getCardSize().width;
  };

  const getSwatches = (type, timed = false) => ref.design && ref.design.types[type] ?
    ref.design.types[type].swatches.map(s => timed ? s.timed : s.normal) : []

  const updateCardSize = () => {
    console.log("UPDATE CARD SIZE", {
      height: Dimensions.get("window").height * 0.9,
      width:
        (Dimensions.get("window").height * 0.9 * ref.design.card_dimensions.width) /
        ref.design.card_dimensions.height,
    });
    setStore("viewport", "card_size", {
      height: Dimensions.get("window").height * 0.9,
      width:
        (Dimensions.get("window").height * 0.9 * ref.design.card_dimensions.width) /
        ref.design.card_dimensions.height,
    })
  }

  const getType = (type) => {
    return state.design.types[type];
  };

  const getGlobalElement = (id) => state.design.globals[id];

  const getLocalElement = ({ index, id, type }) => {
    type = getType(type);
    if (!type) return false;
    if (id) {
      return type.elements.find((e) => e.id === id);
    } else {
      return type.elements[index];
    }
  };

  const getPosition = (element) => {
    let position = element.global
      ? state.design.globals[element.id].position
      : element.position;

    // return { x: 0, y: 0 }

    return {
      x: position.x * getCardSize().width / 100,
      y: position.y * getCardSize().height / 100
    }

  }

  const getDimensions = (element) => {
    let dimensions = element.global
      ? state.design.globals[element.id].dimensions
      : element.dimensions;

    // console.log("dimensions.x", dimensions.width, dimensions.width * getCardSize().width / 100);

    return {
      width: dimensions.width * getCardSize().width / 100,
      height: dimensions.height * getCardSize().height / 100
    }
  }


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
      // width: "100%",
      // height: "100%",
      display: "flex",
      // "flexDirection": "column",
      "pointerEvents": "all",
      // zIndex: props.zIndex,
      // "justifyContent": styles.alignmentVertical,
      // "alignItems": styles.alignmentHorizontal,
      "fontSize": parseInt(convert(styles.size)),
      "fontFamily": styles.family,
      // "letterSpacing": convert(styles.spacing, true),
      // "lineHeight": `${convert(styles.lineHeight)}pt`,
      color: swatches[styles.color],
      // "textShadow":
      //   styles.shadowLeft || styles.shadowLeft || styles.shadowBlur
      //     ? `${styles.shadowLeft ? convert(styles.shadowLeft) : 0}px ${styles.shadowTop ? convert(styles.shadowTop) : 0
      //     }px ${styles.shadowBlur ? convert(styles.shadowBlur) : 0}px ${styles.shadowColor ? swatches[styles.shadowColor] : "black"
      //     }`
      //     : null,
    };
  };



  const getHighlightStyles = ({ element, swatches }) => {
    let styles = getStyles({ element, highlight: true });

    return {
      "fontFamily": styles.family,
      color: swatches[styles.color],
      background: swatches[styles.background],
      display: "inline-block",
      "boxSizing": "border-box",
      "alignItems": styles.alignmentHorizontal,
      "paddingLeft": convert(styles.paddingHorizontal) + "px",
      "paddingRight": convert(styles.paddingHorizontal) + "px",
      "paddingTop": convert(styles.paddingVertical) + "px",
      "paddingBottom": convert(styles.paddingVertical) + "px",
      "marginLeft": convert(styles.marginHorizontal) + "px",
      "marginRight": convert(styles.marginHorizontal) + "px",
      "marginTop": convert(styles.marginVertical) + "px",
      "marginBottom": convert(styles.marginVertical) + "px",
      "borderRadius": convert(styles.borderRadius) + "px",
      "borderWidth": styles.borderWidth + "px",
      "borderColor": swatches[styles.borderColor],
      "borderStyle": "solid",
      // "boxShadow":
      //   styles &&
      //     (styles.boxShadowLeft || styles.boxShadowLeft || styles.boxShadowBlur)
      //     ? `${styles.boxShadowLeft ? convert(styles.boxShadowLeft) : 0}px ${styles.boxShadowTop ? convert(styles.boxShadowTop) : 0
      //     }px ${styles.boxShadowBlur ? convert(styles.boxShadowBlur) : 0}px ${styles.boxShadowColor ? swatches[styles.boxShadowColor] : "black"
      //     }`
      //     : null,
      // "text-shadow":
      //   styles &&
      //     (styles.textShadowLeft ||
      //       styles.textShadowLeft ||
      //       styles.textShadowBlur)
      //     ? `${styles.textShadowLeft ? convert(styles.textShadowLeft) : 0}px ${styles.textShadowTop ? convert(styles.textShadowTop) : 0
      //     }px ${styles.textShadowBlur ? convert(styles.textShadowBlur) : 0
      //     }px ${styles.textShadowColor
      //       ? swatches[styles.textShadowColor]
      //       : "black"
      //     }`
      //     : null,
    };
  };

  let actions = {
    removeInstruction,
    removeFromPrevInstructionIds,
    setIds,
    setDesign,
    setInstructions,
    getCardSize,
    getElements,
    getSwatches,
    getPosition,
    getDimensions,
    getStyles,
    getTextStyles,
    getHighlightStyles,

  }

  let store = [state, actions];


  return <StoreContext.Provider value={store}>
    {props.children}
  </StoreContext.Provider>
}

export function useStore() {
  return React.useContext(StoreContext);
}