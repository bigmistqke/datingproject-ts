import { Dimensions } from "react-native";
import isColor from "../helpers/isColor";

export default function DesignActions({ state, setState, actions, ref }) {
  this.getCardSize = () => state.viewport.card_size;
  this.getCardDimensions = () => state.design.card_dimensions;
  this.getBorderRadius = () => {
    return ref.design.border_radius
  };

  const convert = (value, horizontal = false) => {
    if (!ref.viewport.card_size) this.updateCardSize();
    return !horizontal
      ? parseInt((parseFloat(value) * ref.viewport.card_size.height) / 300)
      : parseInt(parseFloat(value) * ref.viewport.card_size.width);
  };

  this.getElementsOfType = (type_id) => ref.design.types[type_id]

  this.updateCardSize = () =>
    setState("viewport", "card_size", {
      height: Dimensions.get("window").height * 0.9,
      width:
        (Dimensions.get("window").height * 0.9 * ref.design.card_dimensions.width) /
        ref.design.card_dimensions.height,
    })


  this.getType = (type) => state.design.types[type]

  this.isElementVisible = ({ element, modes }) => {
    try {
      if (!modes) throw 'modes is not defined'

      for (let [mode_type, activated] of Object.entries(modes)) {
        if (!(mode_type in element.modes)) {
          console.error(`element does not have mode ${mode_type}`, element);
        }
        if (
          element.modes[mode_type] !== 1 &&
          element.modes[mode_type] !== (activated ? 2 : 0)
        ) {
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error(err, element);
      return false;
    }

  };

  this.getPosition = (element) => ({
    x: element.position.x * state.viewport.card_size.width / 100,
    y: element.position.y * state.viewport.card_size.height / 100
  })

  this.getDimensions = (element) => ({
    width: element.dimensions.width * state.viewport.card_size.width / 100,
    height: element.dimensions.height * state.viewport.card_size.height / 100
  })


  this.getStyles = ({ element, highlight, masked }) =>
    element[highlight ? "highlight_styles" : "styles"][masked ? "masked" : "normal"]

  this.getTextStyles = ({ element, masked }) => {
    let styles = this.getStyles({ element, masked });

    return {
      // width: "100%",
      // height: "100%",
      display: "flex",
      // "flexDirection": "column",
      // "pointerEvents": "all",
      // zIndex: props.zIndex,
      // "justifyContent": styles.alignmentVertical,
      // "alignItems": styles.alignmentHorizontal,
      "fontSize": convert(styles.size),
      "fontFamily": styles.family,
      // "letterSpacing": convert(styles.spacing, true),
      // "lineHeight": `${convert(styles.lineHeight)}pt`,
      color: styles.color,
      // "textShadow":
      //   styles.shadowLeft || styles.shadowLeft || styles.shadowBlur
      //     ? `${styles.shadowLeft ? convert(styles.shadowLeft) : 0}px ${styles.shadowTop ? convert(styles.shadowTop) : 0
      //     }px ${styles.shadowBlur ? convert(styles.shadowBlur) : 0}px ${styles.shadowColor ? swatches[styles.shadowColor] : "black"
      //     }`
      //     : null,
    };
  };


  const convertAlignmentToJustify = (alignment) => {
    switch (alignment) {
      case 'right':
        return 'flex-end';
      case 'center':
        return 'center';
      case 'left':
        return 'flex-start';
      default:
        return alignment
    }
  }

  this.getHighlightStyles = ({ element, masked }) => {
    let styles = this.getStyles({ element, highlight: true, masked });

    return {
      ...this.getTextStyles({ element, masked }),
      "fontFamily": styles.family,
      color: styles.color,
      backgroundColor: styles.background,
      "justifyContent": convertAlignmentToJustify(styles.alignment),
      flex: 0,
      "paddingLeft": convert(styles.paddingHorizontal),
      "paddingRight": convert(styles.paddingHorizontal),
      "paddingTop": convert(styles.paddingVertical),
      "paddingBottom": convert(styles.paddingVertical),
      "marginLeft": convert(styles.marginHorizontal),
      "marginRight": convert(styles.marginHorizontal),
      "marginTop": convert(styles.marginVertical),
      "marginBottom": convert(styles.marginVertical),
      "borderRadius": convert(styles.borderRadius),
    };
  };
}