import "./Block.css";
import DragBox from "./DragBox";
import dragHelper from "../helpers/dragHelper";
import { createMemo } from "solid-js";
import { useStore } from "../managers/Store";
function Block(props) {
  const [state, actions] = useStore();

  /*   const initTranslation = async function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (!state.editor.bools.isShiftPressed) {
      actions.emptySelectedBlockIds();
    }

    actions.addToSelectedBlockIds(props.block_id);

    let lastTick = performance.now();

    let last_position = { x: e.clientX, y: e.clientY };
    let offset;
    await dragHelper((e) => {
      if (performance.now() - lastTick < 1000 / 60) return;
      lastTick = performance.now();
      offset = {
        x: ((last_position.x - e.clientX) * -1) / state.editor.navigation.zoom,
        y: ((last_position.y - e.clientY) * -1) / state.editor.navigation.zoom,
      };

      actions.translateSelectedBlocks({ offset });

      last_position = {
        x: e.clientX,
        y: e.clientY,
      };
    });

    if (!state.editor.bools.isShiftPressed) {
      actions.emptySelectedBlockIds();
    }
  }; */

  const pointerDown = () => {
    if (!state.editor.bools.isShiftPressed) {
      actions.emptySelectedBlockIds();
    }
    actions.addToSelectedBlockIds(props.block_id);
    actions.setBool("isTranslating", true);
  };

  const translate = (offset) => {
    actions.translateSelectedBlocks({ offset });
  };

  const pointerUp = () => {
    if (!state.editor.bools.isShiftPressed) {
      actions.emptySelectedBlockIds();
    }
    actions.setBool("isTranslating", false);
  };

  const contextMenu = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!state.editor.bools.isShiftPressed) {
      actions.emptySelectedBlockIds();
    }

    actions.addToSelectedBlockIds(props.block_id);

    let result = await actions.openPrompt({
      type: "confirm",
      header: "delete selected block(s)",
    });
    if (!result) return;

    let { role_ids } = actions.removeSelectedBlocks();
    role_ids.forEach((role_id) => {
      {
        actions.controlRole(role_id);
      }
    });
  };

  const isErrored = createMemo(
    () => state.editor.errored_block_ids.indexOf(props.block_id) != -1,
    [state.editor.errored_block_ids]
  );

  const isSelected = createMemo(
    () => state.editor.selected_block_ids.indexOf(props.block_id) != -1,
    [state.editor.selected_block_ids]
  );

  return (
    <DragBox
      id={`block_${props.block_id}`}
      classList={{
        block: true,
        isConnecting: state.editor.bools.isConnecting,
        isTranslating: state.editor.bools.isTranslating,
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
}

export default Block;
// export default Block
