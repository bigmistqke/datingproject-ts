import { Dimensions } from "react-native";
import isColor from "../helpers/isColor";

export default function DesignActions({ ref, state, actions }) {
  const convert = (value) =>
    parseInt((parseFloat(value) * ref.viewport.card_size.height) / 300)

  this.getBorderRadius = () => parseInt(ref.design.border_radius);

  this.updateCardSize = (design) => {
    if (ref.viewport.window_size.height / ref.viewport.window_size.width >
      ref.design.card_dimensions.height / ref.design.card_dimensions.width) {

      state.viewport.card_size.set({
        height: (ref.viewport.window_size.width * 0.9 * ref.design.card_dimensions.height) /
          ref.design.card_dimensions.width,
        width: ref.viewport.window_size.width * 0.9,
      })
    } else {
      state.viewport.card_size.set({
        height: ref.viewport.window_size.height * 0.9,
        width:
          (ref.viewport.window_size.height * 0.9 * ref.design.card_dimensions.width) /
          ref.design.card_dimensions.height,
      })
    }

  }

  this.isElementVisible = ({ element, modes }) => {
    try {
      if (!modes)
        return true;

      for (let [mode_type, activated] of Object.entries(modes)) {
        if (!(mode_type in element.modes)) {
          throw [`element does not have mode ${mode_type}`, element]
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

      return false;
    }

  };

  this.getStyles = ({ element, highlight, masked }) =>
    element[highlight ? "highlight_styles" : "styles"][masked ? "masked" : "normal"]

  this.getTextStyles = ({ element, masked }) => {
    let styles = this.getStyles({ element, masked });

    return {
      // width: "100%",
      // height: "100%",
      // display: "flex",
      // "flexDirection": "column",
      // "pointerEvents": "all",
      // zIndex: props.zIndex,
      // "justifyContent": styles.alignmentVertical,
      // "alignItems": styles.alignmentHorizontal,
      "fontSize": convert(styles.size),
      "fontFamily": styles.family,
      "justifyContent": convertAlignmentToJustify(styles.alignment),
      // "letterSpacing": convert(styles.spacing, true),
      // "lineHeight": `${convert(styles.lineHeight)}pt`,
      color: styles.color,
      textShadowColor: styles.shadowColor,
      /*  textShadowOffset: { width: +styles.shadowLeft, height: +styles.shadowTop },
       textShadowRadius: styles.shadowBlur */
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