// import { Dimensions } from "react-native";
import isColor from "../helpers/isColor";

export default function DesignActions({ state, setState, actions, ref }) {
  this.getCardSize = () => state.viewport.card_size;
  this.getCardDimensions = () => state.design.card_dimensions;
  this.getBorderRadius = () => {
    return ref.design.border_radius
  };

  const convert = (value, horizontal = false) => {
    return !horizontal
      ? (parseFloat(value) * state.viewport.card_size.height) / 250
      : parseFloat(value) * state.viewport.card_size.width;
  };




  this.getElements = (type) => ref.design && ref.design.types[type] ?
    ref.design.types[type].elements :
    []



  this.getSwatches = (type, timed = false) => ref.design && ref.design.types[type] ?
    ref.design.types[type].swatches.map(s => timed ? s.timed : s.normal) : []

  this.updateCardSize = () =>
    setState("viewport", "card_size", {
      height: Dimensions.get("window").height * 0.9,
      width:
        (Dimensions.get("window").height * 0.9 * ref.design.card_dimensions.width) /
        ref.design.card_dimensions.height,
    })


  this.getType = (type) => {
    return state.design.types[type];
  };

  this.getGlobalElement = (id) => state.design.globals[id];

  this.getLocalElement = ({ index, id, type }) => {
    type = this.getType(type);
    if (!type) return false;
    if (id) {
      return type.elements.find((e) => e.id === id);
    } else {
      return type.elements[index];
    }
  };

  this.getPosition = (element) => {
    let position = element.global
      ? state.design.globals[element.id].position
      : element.position;

    // return { x: 0, y: 0 }

    return {
      x: position.x * state.viewport.card_size.width / 100,
      y: position.y * state.viewport.card_size.height / 100
    }

  }

  this.getDimensions = (element) => {
    let dimensions = element.global
      ? state.design.globals[element.id].dimensions
      : element.dimensions;

    return {
      width: dimensions.width * state.viewport.card_size.width / 100,
      height: dimensions.height * state.viewport.card_size.height / 100
    }

  }


  this.getStyles = ({ id, index, type, element, highlight }) => {
    const local_element = element
      ? element
      : this.getLocalElement({ id, index, type });
    if (!local_element) return {};

    const style_type = highlight ? "highlight_styles" : "styles";

    if (local_element.global) {
      let global_style = this.getGlobalElement(local_element.id)[style_type];
      return {
        ...global_style,
        ...local_element[style_type],
      };
    }

    return {
      ...local_element[style_type],
    };
  };

  this.getTextStyles = ({ element, swatches }) => {
    let styles = this.getStyles({ element });
    return {
      // width: "100%",
      // height: "100%",
      display: "flex",
      // "flexDirection": "column",
      // "pointerEvents": "all",
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



  this.getHighlightStyles = ({ element, swatches }) => {
    let styles = this.getStyles({ element, highlight: true });

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
}