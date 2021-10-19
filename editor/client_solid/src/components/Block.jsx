import "./Block.css";
import DragBox from "./DragBox";
import cursorEventHandler from "../helpers/cursorEventHandler";
import { createMemo } from "solid-js";
function Block(props) {
  const initTranslation = async function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!props.isShiftPressed) {
      props.storeManager.editor.emptySelectedBlockIds();
    }

    // props.storeManager.blocks.selectBlock({ block: props.block });
    props.storeManager.editor.addToSelectedBlockIds(props.block_id);

    let lastTick = performance.now();

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
  };

  const pointerDown = () => {
    if (!props.isShiftPressed) {
      props.storeManager.editor.emptySelectedBlockIds();
    }
    props.storeManager.editor.addToSelectedBlockIds(props.block_id);
    props.storeManager.editor.setBool("isTranslating", true);
  };

  const translate = (offset) => {
    props.storeManager.script.blocks.translateSelectedBlocks({ offset });
  };

  const pointerUp = () => {
    if (!props.isShiftPressed) {
      props.storeManager.editor.emptySelectedBlockIds();
    }
    props.storeManager.editor.setBool("isTranslating", false);
  };

  const contextMenu = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!props.isShiftPressed) {
      props.storeManager.editor.emptySelectedBlockIds();
    }

    props.storeManager.editor.addToSelectedBlockIds(props.block_id);

    let result = await props.storeManager.editor.openPrompt({
      type: "confirm",
      header: "delete selected block(s)",
    });
    if (!result) return;

    let { role_ids } = props.storeManager.script.blocks.removeSelectedBlocks();
    role_ids.forEach((role_id) => {
      {
        props.storeManager.process.controlRole(role_id);
      }
    });
  };

  const isErrored = createMemo(
    () => props.errored_block_ids.indexOf(props.block_id) != -1,
    [props.errored_block_ids]
  );

  const isSelected = createMemo(
    () => props.selected_block_ids.indexOf(props.block_id) != -1,
    [props.selected_block_ids]
  );

  return (
    <DragBox
      id={`block_${props.block_id}`}
      classList={{
        block: true,
        isConnecting: props.isConnecting,
        isTranslating: props.isTranslating,
        selected: isSelected(),
        isErrored: isErrored(),
      }}
      onPointerDown={pointerDown}
      onPointerUp={pointerUp}
      onTranslate={translate}
      onContextMenu={contextMenu}
      position={props.position}
    >
      {props.children}
    </DragBox>
  );

  /*  (
    <div
      id={`block_${props.block_id}`}
      classList={{
        block: true,
        isConnecting: props.isConnecting,
        selected: props.isSelected,
        isTranslating: props.isTranslating,
        isErrored: props.isErrored,
      }}
      pointerDown={initTranslation}
      onContextMenu={contextMenu}
      style={{
        transform: `translateX(${props.position.x}px) translateY(${props.position.y}px)`,
      }}
    >
      
    </div>
  ); */
}

export default Block;
// export default Block
