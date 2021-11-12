import Draggable from "../viewport/Draggable";
import { onMount, createEffect, createMemo } from "solid-js";
import { styled } from "solid-styled-components";

import SVGElement from "../assets/SVGElement";

const CardElement = (props) => {
  let svg_ref;
  function isDataURL(s) {
    return !!s.match(
      /^\s*data:([a-z]+\/[a-z]+(;[a-z\-]+\=[a-z\-]+)?)?(;base64)?,[a-z0-9\!\$\&\'\,\(\)\*\+\,\;\=\-\.\_\~\:\@\/\?\%\s]*\s*$/i
    );
  }

  const convert = (value, horizontal = false) =>
    !horizontal
      ? (parseFloat(value) * props.card_size.height) / 400
      : parseFloat(value) * props.card_size.width;

  const focusElement = (e) => {
    e.preventDefault();
    if (!props.element.focused) {
      // viewport.focus(id);
    }
  };

  const openContext = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await props.openPrompt({
      type: "options",
      position: { x: e.clientX, y: e.clientY },
      data: {
        options: ["delete", "fill", "fill horizontally", "fill vertically"],
      },
    });

    if (!result) return;

    switch (result) {
      case "delete":
        props.removeElement();
        break;
      case "fill":
        props.onResize({
          dimensions: { width: 100, height: 100 },
          position: { x: 0, y: 0 },
        });
        break;
      case "fill horizontally":
        props.onResize({
          dimensions: { width: 100, height: props.dimensions.height },
          position: { x: 0, y: props.position.y },
        });
        break;
      case "fill vertically":
        props.onResize({
          dimensions: { width: props.dimensions.width, height: 100 },
          position: { x: props.position.x, y: 0 },
        });
        break;
    }
  };

  const getFormattedInstruction = createMemo(() => {
    if (props.element.type !== "instruction") return;
    let formatted_text = [{ type: "normal", content: props.element.content }];
    // regex
    const regex_for_brackets = /[\["](.*?)[\]"][.!?\\-]?/g;
    let matches = props.element.content.match(regex_for_brackets);
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

  const getStyle = createMemo(() => ({
    width: "100%",
    height: "100%",
    display: "flex",
    "flex-direction": "column",
    "pointer-events": "none",
    // zIndex: props.zIndex,
    "justify-content": props.styles ? props.styles.alignmentVertical : null,
    "align-items": props.styles ? props.styles.alignmentHorizontal : null,
    "font-size": props.styles ? convert(props.styles.size) + "pt" : null,
    "font-family": props.styles ? props.styles.family : null,
    "letter-spacing": props.styles ? convert(props.styles.spacing, true) : null,
    "line-height": props.styles
      ? `${convert(props.styles.lineHeight)}pt`
      : null,
    color:
      props.styles && props.swatches
        ? props.swatches[props.styles.color]
        : null,
    "text-shadow":
      props.styles &&
      (props.styles.shadowLeft ||
        props.styles.shadowLeft ||
        props.styles.shadowBlur)
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
  }));

  const getChoiceStyle = createMemo(() => ({
    width: "100%",
    height: "100%",
    display: "inline-block",

    // zIndex: props.zIndex,
    "text-align": props.styles ? props.styles.alignmentHorizontal : null,
    "align-items": props.styles ? props.styles.alignmentVertical : null,
    "font-size": props.styles ? convert(props.styles.size) + "pt" : null,
    "font-family": props.styles ? props.styles.family : null,
    "letter-spacing": props.styles ? props.styles.spacing : null,
    "line-height": props.styles
      ? `${convert(props.styles.lineHeight)}pt`
      : null,
    color:
      props.styles && props.swatches
        ? props.swatches[props.styles.color]
        : null,
    "text-shadow":
      props.styles &&
      (props.styles.shadowLeft ||
        props.styles.shadowLeft ||
        props.styles.shadowBlur)
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
  }));

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

  const Element = styled("div")`
    pointer-events: none;
    & > * {
      pointer-events: all;
    }
  `;

  return (
    <Draggable
      position={{ ...props.position }}
      style={
        props.dimensions
          ? {
              width: props.dimensions.width + "%",
              height: props.dimensions.height + "%",
            }
          : null
      }
      locked={props.locked}
      onPointerDown={(e) => {
        if (e.button === 0) props.onPointerDown(e);
        e.stopPropagation();
      }}
      // onPointerUp={props.onPointerUp}
      onPointerUp={(e) => {
        if (e.button === 0) props.onPointerDown(e);
        e.stopPropagation();
      }}
      onTranslate={props.onTranslate}
      onContextMenu={openContext}
    >
      <Element className="element" style={getStyle()}>
        {props.children}
        <Switch>
          <Match when={props.element.type === "countdown"}>
            {props.element.content}
          </Match>

          <Match when={props.element.type === "instruction"}>
            <For each={getFormattedInstruction()}>
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
                        "text-align":
                          props.highlight_styles.alignmentHorizontal,
                        width: "100%",
                      }}
                    >
                      <For each={instruction.content}>
                        {(choice) => (
                          <div
                            style={{
                              display: "inline-block",
                              "box-sizing": "border-box",
                              "padding-left":
                                convert(
                                  props.highlight_styles.paddingHorizontal
                                ) + "px",
                              "padding-right":
                                convert(
                                  props.highlight_styles.paddingHorizontal
                                ) + "px",
                              "padding-top":
                                convert(
                                  props.highlight_styles.paddingVertical
                                ) + "px",
                              "padding-bottom":
                                convert(
                                  props.highlight_styles.paddingVertical
                                ) + "px",
                              background:
                                props.swatches[
                                  props.highlight_styles.background
                                ],
                              "margin-left":
                                convert(
                                  props.highlight_styles.marginHorizontal
                                ) + "px",
                              "margin-right":
                                convert(
                                  props.highlight_styles.marginHorizontal
                                ) + "px",
                              "margin-top":
                                convert(props.highlight_styles.marginVertical) +
                                "px",
                              "margin-bottom":
                                convert(props.highlight_styles.marginVertical) +
                                "px",
                              "border-radius":
                                convert(props.highlight_styles.borderRadius) +
                                "px",
                              "border-width":
                                props.highlight_styles.borderWidth + "px",
                              "border-color":
                                props.swatches[
                                  props.highlight_styles.borderColor
                                ],
                              "border-style": "solid",
                              "box-shadow":
                                props.highlight_styles &&
                                (props.highlight_styles.boxShadowLeft ||
                                  props.highlight_styles.boxShadowLeft ||
                                  props.highlight_styles.boxShadowBlur)
                                  ? `${
                                      props.highlight_styles.boxShadowLeft
                                        ? convert(
                                            props.highlight_styles.boxShadowLeft
                                          )
                                        : 0
                                    }px ${
                                      props.highlight_styles.boxShadowTop
                                        ? convert(
                                            props.highlight_styles.boxShadowTop
                                          )
                                        : 0
                                    }px ${
                                      props.highlight_styles.boxShadowBlur
                                        ? convert(
                                            props.highlight_styles.boxShadowBlur
                                          )
                                        : 0
                                    }px ${
                                      props.highlight_styles.boxShadowColor
                                        ? props.swatches[
                                            props.highlight_styles
                                              .boxShadowColor
                                          ]
                                        : "black"
                                    }`
                                  : null,
                            }}
                          >
                            <span
                              style={{
                                flex: "none",
                                "font-family": props.highlight_styles.family,
                                color:
                                  props.swatches[props.highlight_styles.color],

                                "text-shadow":
                                  props.highlight_styles &&
                                  (props.highlight_styles.textShadowLeft ||
                                    props.highlight_styles.textShadowLeft ||
                                    props.highlight_styles.textShadowBlur)
                                    ? `${
                                        props.highlight_styles.textShadowLeft
                                          ? convert(
                                              props.highlight_styles
                                                .textShadowLeft
                                            )
                                          : 0
                                      }px ${
                                        props.highlight_styles.textShadowTop
                                          ? convert(
                                              props.highlight_styles
                                                .textShadowTop
                                            )
                                          : 0
                                      }px ${
                                        props.highlight_styles.textShadowBlur
                                          ? convert(
                                              props.highlight_styles
                                                .textShadowBlur
                                            )
                                          : 0
                                      }px ${
                                        props.highlight_styles.textShadowColor
                                          ? props.swatches[
                                              props.highlight_styles
                                                .textShadowColor
                                            ]
                                          : "black"
                                      }`
                                    : null,
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
          </Match>
          <Match when={props.element.type === "svg"}>
            <SVGElement
              masked={props.masked}
              element={props.element}
              svg={props.element.svg}
              styles={props.element.styles}
              swatches={props.swatches}
              masked={props.masked}
            ></SVGElement>
          </Match>
        </Switch>
      </Element>
    </Draggable>
  );
};

export default CardElement;
