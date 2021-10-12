// import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

import { createSignal, onMount } from "solid-js";

import Block from "./Block";
import Connection from "./Connection";

import normalizeWheel from "normalize-wheel";
// import State from "../helpers/react/State.js"
import "./Map.css";

import cursorEventHandler from "../helpers/cursorEventHandler";

function Map(props) {
  let map;

  onMount(() => {
    console.info("mounted");
    console.log(props.storeManager);
  });

  const select = ({ e, coords }) => {
    let selectionBox = {
      width: (e.clientX - coords.x) / props.zoom,
      height: (e.clientY - coords.y) / props.zoom,
      top: (coords.y - props.origin.y) / props.zoom,
      left: (coords.x - props.origin.x) / props.zoom,
    };

    props.storeManager.editor.setSelectionBox(selectionBox);

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
      const selected_block_ids = props.editorState.selected_block_ids;

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
    props.storeManager.editor.setOrigin({
      x: props.origin.x + origin_delta.x,
      y: props.origin.y + origin_delta.y,
    });
  };

  const processNavigation = async (e) => {
    if (!e.target.classList.contains("map-container")) return;
    if (e.buttons === 2) return;
    let coords = { x: e.clientX, y: e.clientY };
    let now = performance.now();

    await cursorEventHandler((e) => {
      now = performance.now();
      if (props.isShiftPressed) {
        select({ e, coords });
      } else {
        move(e, coords);
        coords = {
          x: e.clientX,
          y: e.clientY,
        };
      }
    });

    if (!props.isShiftPressed) {
      props.storeManager.editor.setSelectionBox(false);
      props.storeManager.editor.emptySelectedBlockIds();
    }
  };

  const createBlock = async (e) => {
    e.preventDefault();

    let type = await props.storeManager.editor.openPrompt({
      type: "options",
      header: "create a new block",
      data: {
        options: ["instruction", "trigger"],
      },
    });

    if (!type) return;

    const position = {
      x: (e.clientX - props.origin.x) / props.zoom,
      y: (e.clientY - props.origin.y) / props.zoom,
    };
    props.storeManager.script.blocks.add({ position, type });
  };

  return (
    <div
      className="map-container"
      onMouseDown={processNavigation}
      onContextMenu={createBlock}
    >
      <div
        className={`map ${props.zoomedOut ? "zoomedOut" : ""} ${
          props.connecting ? "connecting" : ""
        }`}
        ref={map}
        style={{
          transform: `translateX(${props.origin.x}px) translateY(${props.origin.y}px)`,
        }}
      >
        <div className="zoom" style={{ transform: `scale(${props.zoom})` }}>
          {props.children}
        </div>
      </div>
    </div>
  );
}

export default Map;
