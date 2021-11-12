import { Show, For, createMemo, Switch, Match, onMount } from "solid-js";

const TextElement = (props) => {
  const getTextAlignFromAlignment = () => {
    switch (props.styles.alignmentHorizontal) {
      case "flex-start":
        return "left";
      case "center":
        return "center";
      case "flex-end":
        return "right";
    }
  };

  const getFormattedContent = createMemo(() => {
    let formatted_text = [{ type: "normal", content: props.content }];
    // regex
    const regex_for_brackets = /[\["](.*?)[\]"][.!?\\-]?/g;
    let matches = String(props.content).match(regex_for_brackets);

    if (!matches) return formatted_text;

    for (let i = matches.length - 1; i >= 0; i--) {
      let split = formatted_text.shift().content.split(`${matches[i]}`);

      let multi_choice = matches[i].replace("[", "").replace("]", "");
      let choices = multi_choice.split("/");

      formatted_text = [
        { type: "normal", content: split[0] },
        { type: "choice", content: choices },
        { type: "normal", content: split[1] },
        ...formatted_text,
      ];
    }

    // return _formattedText;

    return formatted_text;
  });

  const convert = (value, horizontal = false) =>
    !horizontal
      ? (parseFloat(value) * props.card_size.height) / 400
      : parseFloat(value) * props.card_size.width;

  const getStyle = () => {
    return !props.styles
      ? {
          width: "100%",
          height: "100%",
          display: "flex",
          "flex-direction": "column",
          "pointer-events": "all",
        }
      : {
          width: "100%",
          height: "100%",
          display: "flex",
          "flex-direction": "column",
          "pointer-events": "all",
          // zIndex: props.zIndex,
          "justify-content": props.styles.alignmentVertical,
          "align-items": props.styles.alignmentHorizontal,
          "font-size": convert(props.styles.size) + "pt",
          "font-family": props.styles.family,
          "letter-spacing": convert(props.styles.spacing, true),
          "line-height": `${convert(props.styles.lineHeight)}pt`,
          color: props.swatches[props.styles.color],
          "text-shadow":
            props.styles.shadowLeft ||
            props.styles.shadowLeft ||
            props.styles.shadowBlur
              ? `${
                  props.styles.shadowLeft ? convert(props.styles.shadowLeft) : 0
                }px ${
                  props.styles.shadowTop ? convert(props.styles.shadowTop) : 0
                }px ${
                  props.styles.shadowBlur ? convert(props.styles.shadowBlur) : 0
                }px ${
                  props.styles.shadowColor
                    ? props.swatches[props.styles.shadowColor]
                    : "black"
                }`
              : null,
        };
  };

  const getHighlightStyles = createMemo(() => {
    return props.highlight_styles
      ? {
          "font-family": props.highlight_styles.family,
          color: props.swatches[props.highlight_styles.color],
          background: props.swatches[props.highlight_styles.background],
          display: "inline-block",
          "box-sizing": "border-box",
          "padding-left":
            convert(props.highlight_styles.paddingHorizontal) + "px",
          "padding-right":
            convert(props.highlight_styles.paddingHorizontal) + "px",
          "padding-top": convert(props.highlight_styles.paddingVertical) + "px",
          "padding-bottom":
            convert(props.highlight_styles.paddingVertical) + "px",

          "margin-left":
            convert(props.highlight_styles.marginHorizontal) + "px",
          "margin-right":
            convert(props.highlight_styles.marginHorizontal) + "px",
          "margin-top": convert(props.highlight_styles.marginVertical) + "px",
          "margin-bottom":
            convert(props.highlight_styles.marginVertical) + "px",
          "border-radius": convert(props.highlight_styles.borderRadius) + "px",
          "border-width": props.highlight_styles.borderWidth + "px",
          "border-color": props.swatches[props.highlight_styles.borderColor],
          "border-style": "solid",
          "box-shadow":
            props.highlight_styles &&
            (props.highlight_styles.boxShadowLeft ||
              props.highlight_styles.boxShadowLeft ||
              props.highlight_styles.boxShadowBlur)
              ? `${
                  props.highlight_styles.boxShadowLeft
                    ? convert(props.highlight_styles.boxShadowLeft)
                    : 0
                }px ${
                  props.highlight_styles.boxShadowTop
                    ? convert(props.highlight_styles.boxShadowTop)
                    : 0
                }px ${
                  props.highlight_styles.boxShadowBlur
                    ? convert(props.highlight_styles.boxShadowBlur)
                    : 0
                }px ${
                  props.highlight_styles.boxShadowColor
                    ? props.swatches[props.highlight_styles.boxShadowColor]
                    : "black"
                }`
              : null,
          "text-shadow":
            props.highlight_styles &&
            (props.highlight_styles.textShadowLeft ||
              props.highlight_styles.textShadowLeft ||
              props.highlight_styles.textShadowBlur)
              ? `${
                  props.highlight_styles.textShadowLeft
                    ? convert(props.highlight_styles.textShadowLeft)
                    : 0
                }px ${
                  props.highlight_styles.textShadowTop
                    ? convert(props.highlight_styles.textShadowTop)
                    : 0
                }px ${
                  props.highlight_styles.textShadowBlur
                    ? convert(props.highlight_styles.textShadowBlur)
                    : 0
                }px ${
                  props.highlight_styles.textShadowColor
                    ? props.swatches[props.highlight_styles.textShadowColor]
                    : "black"
                }`
              : null,
        }
      : null;
  });
  return (
    <>
      <div className="text-container" style={getStyle()}>
        <For each={getFormattedContent()}>
          {(instruction) => (
            <Switch>
              <Match when={instruction.type === "normal"}>
                <span
                  style={{
                    "text-align": getTextAlignFromAlignment(),
                  }}
                >
                  {instruction.content}
                </span>
              </Match>
              <Match when={instruction.type === "choice"}>
                <div
                  style={{
                    "text-align": props.highlight_styles.alignmentHorizontal,
                    width: "100%",
                  }}
                >
                  <For each={instruction.content}>
                    {(choice) => (
                      <div style={getHighlightStyles()}>
                        <span
                          style={{
                            flex: "none",
                          }}
                        >
                          {choice}
                        </span>
                      </div>
                    )}
                  </For>
                </div>
              </Match>
            </Switch>
          )}
        </For>
      </div>
    </>
  );
};

export default TextElement;
