import { HeaderContainer } from "./UI_Components";
import { styled } from "solid-styled-components";

import HierarchyElement from "./HierarchyElement";

import { useStore } from "../../Store";

const Hierarchy = (props) => {
  const [state, { getLocalElements, changeOrderElement }] = useStore();

  const onDrop = (e) => {
    let from = parseInt(e.dataTransfer.getData("index"));

    if (!from && from !== 0) return;
    changeOrderElement(from, 0);
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
      <div className="hierarchy-container" style={{ height: "100%" }}>
        <ReversedList onDrop={onDrop} onDragOver={allowDrag}>
          <For each={getLocalElements()}>
            {(element, index) => (
              <HierarchyElement
                element={element}
                index={index()}
                locked={element.locked}
                selected={state.viewport.selected_element_index === index()}
                hide_modes={state.viewport.type === "back"}
              ></HierarchyElement>
            )}
          </For>
        </ReversedList>
      </div>
    </HeaderContainer>
  );
};

export default Hierarchy;
