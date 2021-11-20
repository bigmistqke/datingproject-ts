import { ColumnContainer, FlexRow, Button } from "./UI_Components";
import { styled } from "solid-styled-components";

import { Show } from "solid-js";

import { useStore } from "../../Store";

const HierarchyElement = (props) => {
  const [
    state,
    {
      changeOrderElement,
      lockElement,
      toggleModeElement,
      removeElement,
      setSelectedElementIndex,
    },
  ] = useStore();
  const onDrop = (e) => {
    e.stopPropagation();
    let to = props.index;
    let from = parseInt(e.dataTransfer.getData("index"));
    if (!from && from !== 0) return;
    changeOrderElement(from, to);
  };

  const allowDrag = (e) => {
    e.preventDefault();
  };

  const dragStart = (e) => {
    e.dataTransfer.setData("index", props.index);
  };

  const Name = styled("span")`
    flex: 1;
  `;

  const OrderNumber = styled("label")`
    font-size: 6pt;
    color: var(--medium);
  `;

  const toggleMode = (index, type) => {
    toggleModeElement(index, JSON.parse(JSON.stringify(type)));
  };

  const mode_colors = ["var(--red)", "var(--yellow)", "var(--green)"];

  const getColor = (index) => {
    return mode_colors[index];
  };

  return (
    <>
      <ColumnContainer
        onMouseDown={() => setSelectedElementIndex(props.index)}
        draggable="true"
        onDragStart={dragStart}
        onDragOver={allowDrag}
        onDrop={onDrop}
        style={{
          background: props.selected ? "rgb(236, 236, 236)" : "white",
        }}
      >
        <FlexRow>
          <OrderNumber>{props.index}</OrderNumber>
          <Name>
            {props.element.type} : {String(props.element.content).slice(0, 25)}
          </Name>

          <Button onMouseDown={() => lockElement(props.index, !props.locked)}>
            {props.element.locked ? "unlock" : "lock"}
          </Button>

          <Show
            when={
              props.element.type !== "instruction" &&
              props.element.type !== "countdown"
            }
          >
            <Button
              style={{ "font-size": "5pt" }}
              onMouseDown={() => removeElement(props.index)}
            >
              ✕
            </Button>
          </Show>
        </FlexRow>
        <Show when={props.element.modes}>
          <FlexRow
            style={{
              height: "15px",
              padding: "0px",
              "justify-content": "end",
            }}
          >
            {/* <Show when={!props.hide_modes}> */}
            <For each={Object.entries(props.element.modes)}>
              {([mode, visible]) => (
                <Button
                  style={{
                    background: getColor(visible),
                  }}
                  onMouseDown={(e) => {
                    toggleMode(props.index, mode);
                  }}
                >
                  {mode}
                </Button>
              )}
            </For>
            {/* </Show> */}
          </FlexRow>
        </Show>

        {/* </div> */}
      </ColumnContainer>
    </>
  );
};

export default HierarchyElement;
