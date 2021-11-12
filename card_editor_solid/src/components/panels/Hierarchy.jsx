import {
  HeaderContainer,
  ColumnContainer,
  FlexRow,
  Button,
} from "./UI_Components";
import { Show, onMount } from "solid-js";
import { styled } from "solid-styled-components";

const HierarchyElement = (props) => {
  const onDrop = (e) => {
    e.stopPropagation();
    let to = props.index;
    let from = parseInt(e.dataTransfer.getData("index"));
    if (!from && from !== 0) return;
    props.changeOrder(from, to);
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
    props.toggleVisiblity(index, JSON.parse(JSON.stringify(type)));
  };

  const mode_colors = ["var(--red)", "var(--yellow)", "var(--green)"];

  const getColor = (index) => {
    return mode_colors[index];
  };

  onMount(() =>
    console.log("HierarchyElement", props.element, props.element.modes)
  );

  return (
    <>
      <ColumnContainer
        onMouseDown={props.select}
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

          <Button onMouseDown={() => props.setLocked()}>
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
              onMouseDown={() => props.remove(props.index)}
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

const HierarchyList = (props) => {
  const onDrop = (e) => {
    let from = parseInt(e.dataTransfer.getData("index"));

    if (!from && from !== 0) return;
    props.changeOrderElement(from, 0);
  };

  const allowDrag = (e) => e.preventDefault();

  const ReversedList = styled("div")`
    flex-direction: column-reverse;
    display: flex;
    justify-content: flex-end;
    height: 100%;
  `;

  return (
    <HeaderContainer label="Hierarchy">
      <div
        // onDrop={onDrop}
        className="hierarchy-container"
        style={{ height: "100%" }}
      >
        <ReversedList onDrop={onDrop} onDragOver={allowDrag}>
          <For each={props.elements}>
            {(element, index) => (
              <HierarchyElement
                index={index()}
                visible={props.elementIsVisible(element)}
                remove={props.removeElement}
                changeOrder={props.changeOrderElement}
                setLocked={() =>
                  props.setLockedElement(index(), !element.locked)
                }
                toggleVisiblity={props.toggleModeElement}
                select={() => props.selectElement(index())}
                element={element}
                selected={props.selected_element_index === index()}
                card_type={props.type}
                hide_modes={props.hide_modes}
              ></HierarchyElement>
            )}
          </For>
        </ReversedList>
      </div>
    </HeaderContainer>
  );
};

export { HierarchyElement, HierarchyList };
