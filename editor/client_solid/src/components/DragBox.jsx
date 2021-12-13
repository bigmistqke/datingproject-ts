import { createMemo, createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { styled } from "solid-styled-components";

import dragHelper from "../helpers/dragHelper";
import { overlaps } from "../helpers/collisionDetection";
import { useStore } from "../managers/Store";

export default function DragBox(props) {
  const [state, actions] = useStore();
  let [grid_position, setGridPosition] = createStore([
    { x: null, y: null },
    { x: null, y: null },
  ]);

  let drag_box = null;

  let getClassList = createMemo(
    () => (props.classList ? props.classList : {}),
    [props.classList]
  );

  const isSelected = createMemo(
    () => state.editor.selection.indexOf(props.id) !== -1,
    [state.editor.selection]
  );

  const initTranslation = async function (e) {
    if (e.button !== 0 || !e.target.classList.contains("handle")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    actions.addToSelection(props.id);

    let lastTick = performance.now();

    let last_position = { x: e.clientX, y: e.clientY };
    let offset;

    await dragHelper((e) => {
      if (performance.now() - lastTick < 1000 / 60) return;
      lastTick = performance.now();
      offset = {
        x: (last_position.x - e.clientX) * -1,
        y: (last_position.y - e.clientY) * -1,
      };

      actions.translateSelectedNodes({ offset });

      last_position = {
        x: e.clientX,
        y: e.clientY,
      };
    });

    if (
      !state.editor.bools.isShiftPressed &&
      state.editor.selection.length === 1
    ) {
      actions.emptySelection();
    }
  };

  const check = (bool) => !(!bool && bool !== 0);

  const isVisible = createMemo(() => {
    if (!check(actions.getOriginGrid()[0].x) || !check(grid_position[0].x))
      return true;
    return (
      (actions.getOriginGrid()[0].x <= grid_position[0].x &&
        actions.getOriginGrid()[0].y <= grid_position[0].y &&
        actions.getOriginGrid()[1].x >= grid_position[0].x &&
        actions.getOriginGrid()[1].y >= grid_position[0].y) ||
      (actions.getOriginGrid()[0].x <= grid_position[1].x &&
        actions.getOriginGrid()[0].y <= grid_position[0].y &&
        actions.getOriginGrid()[1].x >= grid_position[1].x &&
        actions.getOriginGrid()[1].y >= grid_position[0].y) ||
      (actions.getOriginGrid()[0].x <= grid_position[0].x &&
        actions.getOriginGrid()[0].y <= grid_position[1].y &&
        actions.getOriginGrid()[1].x >= grid_position[0].x &&
        actions.getOriginGrid()[1].y >= grid_position[1].y) ||
      (actions.getOriginGrid()[0].x <= grid_position[1].x &&
        actions.getOriginGrid()[0].y <= grid_position[1].y &&
        actions.getOriginGrid()[1].x >= grid_position[1].x &&
        actions.getOriginGrid()[1].y >= grid_position[1].y)
    );
  });

  createEffect(() => {
    let selection_box = actions.getSelectionBox();
    if (!drag_box || !selection_box) return;

    const collision = overlaps(
      [
        { ...props.position },
        {
          x: props.position.x + drag_box.offsetWidth,
          y: props.position.y + drag_box.offsetHeight,
        },
      ],
      [
        {
          x: parseInt(selection_box.left),
          y: parseInt(selection_box.top),
        },
        {
          x: parseInt(selection_box.left) + parseInt(selection_box.width),
          y: parseInt(selection_box.top) + parseInt(selection_box.height),
        },
      ]
    );
    if (isSelected() && !collision) {
      console.log("deselect ", props.id);
      actions.removeFromSelection(props.id);
    }
    if (!isSelected() && collision) {
      actions.addToSelection(props.id);
    }
  });

  createEffect(() => {
    if (!drag_box || !props.instructions) return false;
    setGridPosition(
      0,
      "x",
      parseInt(props.position.x / state.editor.navigation.grid_size)
    );
    setGridPosition(
      0,
      "y",
      parseInt(props.position.y / state.editor.navigation.grid_size)
    );
    setGridPosition(
      1,
      "x",
      parseInt(
        (props.position.x + drag_box.offsetWidth) /
          state.editor.navigation.grid_size
      )
    );
    setGridPosition(
      1,
      "y",
      parseInt(
        (props.position.y + drag_box.offsetHeight) /
          state.editor.navigation.grid_size
      )
    );
  });

  const DragBox = styled("div")`
    display: block;
    cursor: grab;
    position: absolute;
    box-sizing: border-box;
    box-shadow: var(--dark-shadow);
    border-radius: 25px;
    background: var(--light-grey);
    width: 900px;
    transform: translate(0px, 0px);
    &.selected {
      z-index: 1;
    }
    &.selected .handle,
    &.handle:hover {
      border-radius: 28px;
      border: 4px solid var(--selected-color);
      margin: -4px;
    }

    &.isErrored > .handle {
      background: hsl(0, 100%, 92%) !important;
    }
  `;

  const DragBoxHandle = styled("div")`
    z-index: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    /* border-radius: 25px; */
    transition: background 0.125s;
    box-sizing: content-box;
  `;

  const DragBoxChildren = styled("div")`
    margin: 11px;
    position: relative;
    z-index: 1;
    pointer-events: none;
    border-radius: 16px;
    overflow: hidden;
    & > * {
      pointer-events: all;
    }
  `;

  return (
    <DragBox
      ref={drag_box}
      id={`drag_${props.id}`}
      classList={{
        selected: isSelected(),
        ...getClassList(),
      }}
      onPointerDown={initTranslation}
      onContextMenu={props.onContextMenu}
      style={{
        ...props.style,
        // transform: `translate(${props.position.x}px, ${props.position.y}px)`,
        left: props.position.x + "px",
        top: props.position.y + "px",
        // display: isVisible() ? "" : "none",
      }}
      visible={isVisible()}
    >
      <DragBoxHandle className="handle"></DragBoxHandle>
      <DragBoxChildren
        style={{
          visible: isVisible() ? "" : "hidden",
        }}
      >
        {props.children}
      </DragBoxChildren>
    </DragBox>
  );
}
