import uniqid from "uniqid";

import getRandomHue from "../helpers/getRandomHue";
import arrayOfObjectsToObject from "../helpers/arrayOfObjectsToObject";

import Bubble from "../components/Bubble";

import { array_insert, array_remove_element } from "../helpers/Pure"



// const uniqid = () => { };
const prevOrNext = (direction) =>
  direction === "out" ? "next_block_id" : "prev_block_id";
const oppositeDirection = (direction) => (direction === "out" ? "in" : "out");

const EditorManager = function ({
  storeManager,
  scriptState,
  editorState,
  setEditorState,
}) {
  //// INTERNALS

  const updateErroredBlockIds = () => {
    let block_ids = [];
    Object.values(editorState.errors).forEach((errors) => {
      errors.forEach((error) => {
        if (!error.block_ids) return;
        error.block_ids.forEach((block_id) => {
          if (block_ids.indexOf(block_id) !== -1) return;
          block_ids.push(block_id);
        });
      });
    });

    setEditorState("errored_block_ids", block_ids);
  };

  //// PUBLIC FUNCTIONS

  this.setSelectionBox = (bool) => setEditorState("gui", "selectionBox", bool);
  this.setOrigin = (origin) => setEditorState("navigation", "origin", origin);

  this.setErrorsRoleId = ({ role_id, errors }) => {
    setEditorState("errors", role_id, errors);
    updateErroredBlockIds();
  };


  this.openGui = (type) => setEditorState("gui", type, true);
  this.closeGui = (type) => setEditorState("gui", type, false);
  this.toggleGui = (type) =>
    setEditorState("gui", type, !editorState.gui[type]);

  this.openPrompt = async function ({ type, header, data }) {
    return new Promise((_resolve) => {
      const resolve = (data) => {
        setEditorState("gui", "prompt", false);
        _resolve(data);
      };

      setEditorState("gui", "prompt", { type, header, data, resolve });
    });
  };
  this.closePrompt = () => setEditorState("gui", "prompt", false);

  this.setTooltip = (tooltip) => {
    setEditorState("gui", "tooltip", tooltip)
  };

  this.closeRoleAdmin = () => setEditorState("gui", "role_admin", false);

  // navigation

  this.zoomIn = (e) => {
    let new_zoom = editorState.navigation.zoom * 1.3;
    let new_origin = {
      x: getOrigin().x + 0.3 * (getOrigin().x - window.innerWidth / 2),
      y: getOrigin().y + 0.3 * (getOrigin().y - window.innerHeight / 2),
    };

    setEditorState("navigation", "origin", new_origin);
    setEditorState("navigation", "zoom", new_zoom);

    if (new_zoom > 0.4) {
      setEditorState("bools", "isZoomedOut", false);
    }
  };

  this.zoomOut = (e) => {
    let zoom = editorState.navigation.zoom * 0.7;
    let origin = editorState.navigation.origin;
    origin = {
      x: origin.x - 0.3 * (origin.x - window.innerWidth / 2),
      y: origin.y - 0.3 * (origin.y - window.innerHeight / 2),
    };
    setEditorState("navigation", "origin", origin);
    setEditorState("navigation", "zoom", zoom);

    if (new_zoom < 0.4) {
      setEditorState("bools", "isZoomedOut", false);
    }
  };

  this.addToSelectedBlockIds = (block_id) => {
    if (editorState.selected_block_ids.indexOf(block_id) != -1) return;
    setEditorState("selected_block_ids", [
      ...editorState.selected_block_ids,
      block_id,
    ]);
  };

  this.removeFromSelectedBlockIds = (block_id) => {
    let index = editorState.selected_block_ids.indexOf(block.block_id);
    if (index === -1) return;
    setEditorState(
      "selected_block_ids",
      editorState.selected_block_ids.splice(index, 1)
    );
  };

  this.emptySelectedBlockIds = () => {
    setEditorState("selected_block_ids", []);
  };

  this.updateRoleOffset = ({ block_id, role_id, direction, offset }) => {
    if (!(block_id in editorState.role_offsets)) {
      setEditorState("role_offsets", block_id, {});
    }
    if (!(role_id in editorState.role_offsets[block_id])) {
      setEditorState("role_offsets", block_id, role_id, {});
    }
    setEditorState("role_offsets", block_id, role_id, direction, offset);
  };
  this.updateBlockDimension = ({ block_id, dimension }) => {
    setEditorState("block_dimensions", block_id, dimension);
  };

  this.setConnecting = (bool) => setEditorState("bools", "isConnecting", bool);

  this.addTemporaryConnection = ({ block_id, role_id, next_block_id = false, direction, cursor }) => {

    /* let next_block_id =
      scriptState.blocks[block_id].roles[role_id][prevOrNext(direction)]; */
    console.log("NEXT_BLOCK_ID ", next_block_id);
    if (next_block_id) {
      setEditorState("temporary_connections", [
        ...editorState.temporary_connections,
        {
          block_id,
          next_block_id,
          role_id,
          direction: oppositeDirection(direction),
          cursor,
        },
      ]);
    } else {
      setEditorState("temporary_connections", [
        ...editorState.temporary_connections,
        {
          block_id,
          role_id,
          direction,
          cursor,
        },
      ]);
    }
  };

  this.removeTemporaryConnection = ({ block_id, role_id, direction }) => {
    setEditorState(
      "temporary_connections",
      editorState.temporary_connections.filter(
        (t_c) =>
          !(
            t_c.block_id === block_id &&
            t_c.role_id === role_id &&
            t_c.direction === direction
          )
      )
    );
  };

  this.navigateToBlockId = (block_id) => {
    let position = scriptState.blocks[block_id].position;
    setEditorState("navigation", "origin", {
      x: position.x * -1 + window.innerWidth / 2 - 900 / 2,
      y: position.y * -1 + 200,
    });

    this.emptySelectedBlockIds();
    this.addToSelectedBlockIds(block_id);
  };

  this.setBool = (bool_type, bool) => setEditorState("bools", bool_type, bool)

  this.setSubMenu = (type) => setEditorState("gui", "sub_menu", type)
  this.toggleSubMenu = (type) => editorState.gui.sub_menu === type ? this.setSubMenu(false) : this.setSubMenu(type);

};


const StoreManager = function ({
  scriptState,
  setScriptState,
  editorState,
  setEditorState,
  script_id,
  dataProcessor,
}) {
  let storeManager = this;
  this.editor = new EditorManager({
    storeManager,
    scriptState,
    editorState,
    setEditorState,
  });

  this.script = new ScriptManager({
    editorManager: this.editor,
    editorState,
    scriptState,
    setScriptState,
    script_id,
    dataProcessor,
  });

  this.process = new (function () {
    this.getEndBlockId = async ({ block_id, role_id }) => dataProcessor.getEndBlock({ block_id, role_id })
    this.traverseRole = async ({ block_id, role_id }) => dataProcessor.traverseRole({ block_id, role_id })

    this.controlRole = async (role_id) => {
      let result = await dataProcessor.controlRole(role_id);
      storeManager.editor.setErrorsRoleId({
        role_id,
        errors: result.success ? [] : result.errors,
      })
    };

  })()


};

export default StoreManager;
