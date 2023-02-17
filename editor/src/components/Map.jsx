import { createEffect, onMount } from "solid-js";

import "./Map.css";

import dragHelper from "../helpers/dragHelper";

import { useStore } from "../managers/Store";

function Map(props) {
  const [state, actions] = useStore();

  let map;

  const select = ({ e, coords }) => {
    let selectionBox = {
      width: (e.clientX - coords.x) / actions.getZoom() + "px",
      height: (e.clientY - coords.y) / actions.getZoom() + "px",
      top: (coords.y - actions.getOrigin().y) / actions.getZoom() + "px",
      left: (coords.x - actions.getOrigin().x) / actions.getZoom() + "px",
    };

    actions.setSelectionBox(selectionBox);
  };

  const move = (e, coords) => {
    let origin_delta = {
      x: e.clientX - coords.x,
      y: e.clientY - coords.y,
    };
    actions.setOrigin({
      x: parseInt(state.editor.navigation.origin.x + origin_delta.x),
      y: parseInt(state.editor.navigation.origin.y + origin_delta.y),
    });
  };

  const processNavigation = async (e) => {
    if (!e.target.classList.contains("map-container")) return;
    if (e.buttons === 2) return;
    let coords = { x: e.clientX, y: e.clientY };
    let now = performance.now();

    // actions.setBool("isTranslating", true);

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

    actions.setSelectionBox(false);

    // actions.setBool("isTranslating", false);
    // actions.setSelectionBox(false);

    /*  if (!state.editor.bools.isShiftPressed) {
      // actions.setSelectionBox(false);
      actions.emptySelection();
    } */
  };

  const createNode = async (e) => {
    e.preventDefault();

    let type = await actions.openPrompt({
      type: "options",
      header: "create a new node",
      data: {
        options: ["instruction"],
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
    actions.addNode({ position, type });
  };

  const scrollMap = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (state.editor.bools.isCtrlPressed) {
      actions.offsetZoom(e.deltaY * 0.001);
    } else {
      actions.offsetOrigin({ x: e.deltaX * -1, y: e.deltaY * -1 });
    }
  };

  return (
    <div
      className="map-container"
      onMouseDown={processNavigation}
      onContextMenu={createNode}
      onWheel={scrollMap}
    >
      <div
        className={`map ${
          state.editor.navigation.zoomedOut ? "zoomedOut" : ""
        }`}
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
