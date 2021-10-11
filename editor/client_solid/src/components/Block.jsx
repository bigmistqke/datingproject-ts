import "./Block.css";

import { createSignal, createEffect } from "solid-js";
import Roles from "./Roles";

import cursorEventHandler from "../helpers/cursorEventHandler";

function Block(props) {
  let container_ref;

  const [isTranslating, setIsTranslating] = createSignal(false);

  const getConnectionError = (direction, errors) => {
    return errors && direction in errors ? errors[direction] : false;
  };

  const initTranslation = async function (e) {
    if (e.button !== 0) return;
    if (!e.target.classList.contains("block-drag")) return;
    e.preventDefault();
    e.stopPropagation();

    // props.storeManager.blocks.selectBlock({ block: props.block });
    props.storeManager.editor.addToSelectedBlockIds(props.block_id);

    let lastTick = performance.now();
    setIsTranslating(true);

    // await props.storeManager.blocks.processPosition(e, props.block, props.zoom);

    let last_position = { x: e.clientX, y: e.clientY };
    let offset;
    await cursorEventHandler((e) => {
      if (performance.now() - lastTick < 1000 / 60) return;
      lastTick = performance.now();
      offset = {
        x: ((last_position.x - e.clientX) * -1) / props.zoom,
        y: ((last_position.y - e.clientY) * -1) / props.zoom,
      };

      props.storeManager.script.blocks.translateSelectedBlocks({ offset });

      last_position = {
        x: e.clientX,
        y: e.clientY,
      };
    });

    if (!props.isShiftPressed) {
      props.storeManager.editor.emptySelectedBlockIds();
    }
    setIsTranslating(false);
  };

  const contextMenu = async (e) => {
    /*     let result = await props.storeManager.editor.openOverlay({
      type: "options",
      data: {
        options: ["delete blocks", "convert roles"],
      },
    });

    if (!result) return;

    if (result === "delete blocks") {
      if (props.editorState.selected_block_ids.length > 1) {
        this.deleteSelectedBlocks();
      } else {
        deleteBlock(props.block_id);
      }
    } else if (result === "convert roles") {
      //   props.storeManager.blocks.convertRoles({ block });
    } */
  };

  createEffect(() => {
    if (!container_ref) return;
    container_ref.style.transform = `translateX(${props.position.x}px) translateY(${props.position.y}px)`;
  }, [props.position]);

  return (
    <div
      id={`block_${props.block_id}`}
      classList={{
        block: true,
        isConnecting: props.isConnecting,
        selected: props.isSelected,
        isTranslating: props.isTranslating,
      }}
      onPointerDown={initTranslation}
      onContextMenu={contextMenu}
      ref={container_ref}
    >
      <div className="block-drag"></div>
      <div
        className="block-children"
        style={{ "pointer-events": props.isConnecting ? "none" : "all" }}
      >
        {props.children}
      </div>
    </div>
  );
}

export default Block;
// export default Block
