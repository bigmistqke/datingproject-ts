import { createSignal, onMount } from "solid-js";

import "./Map.css";

import dragHelper from "../helpers/dragHelper";

import { useStore } from "../managers/Store";

function Map(props) {
  const [state, actions] = useStore();

  let map;

  onMount(() => {
    console.info("mounted");
    // console.log(props.storeManager);
  });

  const select = ({ e, coords }) => {
    let selectionBox = {
      width: (e.clientX - coords.x) / props.zoom,
      height: (e.clientY - coords.y) / props.zoom,
      top: (coords.y - props.origin.y) / props.zoom,
      left: (coords.x - props.origin.x) / props.zoom,
    };

    actions.setSelectionBox(selectionBox);

    /* let collisions = props.blocks
      .filter((block) => {
        if (!block.boundingBox) return;
        return (
          block.boundingBox.left < selectionBox.left + selectionBox.width &&
          block.boundingBox.left + block.boundingBox.width >
            selectionBox.left &&
          block.boundingBox.top < selectionBox.top + selectionBox.height &&
          block.boundingBox.top + block.boundingBox.height > selectionBox.top
        );
      })
      .map((block) => block.block_id);

    collisions.forEach(({ block_id }) =>
      props.storeManager.blocks.select(block_id)
    );

    if (!ctrlPressed) {
      const selected_block_ids = props.state.editor.selected_block_ids;

      const block_ids_to_deselect = selected_block_ids.filter(
        (selected_block_id) => collisions.indexOf(selected_block_id) != -1
      );

      if (block_ids_to_deselect.length == 0) return;

      block_ids_to_deselect.forEach((block_id) => {
        props.storeManager.blocks.deselect(block_id);
      });
    } */
  };

  const move = (e, coords) => {
    let origin_delta = {
      x: e.clientX - coords.x,
      y: e.clientY - coords.y,
    };
    actions.setOrigin({
      x: state.editor.navigation.origin.x + origin_delta.x,
      y: state.editor.navigation.origin.y + origin_delta.y,
    });
  };

  const processNavigation = async (e) => {
    if (!e.target.classList.contains("map-container")) return;
    if (e.buttons === 2) return;
    let coords = { x: e.clientX, y: e.clientY };
    let now = performance.now();

    actions.setBool("isTranslating", true);

    await dragHelper((e) => {
      now = performance.now();
      if (state.editor.bools.isShiftPressed) {
        select({ e, coords });
      } else {
        move(e, coords);
        coords = {
          x: e.clientX,
          y: e.clientY,
        };
      }
    });

    actions.setBool("isTranslating", false);

    if (!state.editor.bools.isShiftPressed) {
      actions.setSelectionBox(false);
      actions.emptySelectedBlockIds();
    }
  };

  const createBlock = async (e) => {
    e.preventDefault();

    let type = await actions.openPrompt({
      type: "options",
      header: "create a new block",
      data: {
        options: ["instruction", "trigger"],
      },
    });

    if (!type) return;

    const position = {
      x:
        (e.clientX - state.editor.navigation.origin.x) /
        state.editor.navigation.zoom,
      y:
        (e.clientY - state.editor.navigation.origin.y) /
        state.editor.navigation.zoom,
    };
    actions.addBlock({ position, type });
  };

  return (
    <div
      className="map-container"
      onMouseDown={processNavigation}
      onContextMenu={createBlock}
    >
      <div
        className={`map ${
          state.editor.navigation.zoomedOut ? "zoomedOut" : ""
        } ${state.editor.bools.isConnecting ? "connecting" : ""}`}
        ref={map}
        style={{
          transform: `translateX(${state.editor.navigation.origin.x}px) translateY(${state.editor.navigation.origin.y}px)`,
        }}
      >
        <div
          className="zoom"
          style={{ transform: `scale(${state.editor.navigation.zoom})` }}
        >
          {props.children}
        </div>
      </div>
    </div>
  );
}

export default Map;
