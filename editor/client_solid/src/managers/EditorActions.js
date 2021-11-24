import { produce } from "solid-js/store";

export default function EditorActions({ state, setState, actions }) {
  //// INTERNALS

  const updateErroredBlockIds = () => {
    let block_ids = [];
    Object.values(state.editor.errors).forEach((errors) => {
      errors.forEach((error) => {
        if (!error.block_ids) return;
        error.block_ids.forEach((block_id) => {
          if (block_ids.indexOf(block_id) !== -1) return;
          block_ids.push(block_id);
        });
      });
    });

    setState("editor", "errored_block_ids", block_ids);
  };

  //// PUBLIC FUNCTIONS

  this.setCursor = (cursor) =>
    setState("editor", "navigation", "cursor", cursor);

  this.setSelectionBox = (bool) =>
    setState("editor", "gui", "selectionBox", bool);
  this.setOrigin = (origin) =>
    setState("editor", "navigation", "origin", origin);

  this.setErrorsRoleId = ({ role_id, errors }) => {
    setState("editor", "errors", role_id, errors);
    updateErroredBlockIds();
  };

  this.openGui = (type) => setState("editor", "gui", type, true);
  this.closeGui = (type) => setState("editor", "gui", type, false);
  this.toggleGui = (type) => setState("editor", "gui", type, (bool) => !bool);

  this.openPrompt = async function ({ type, header, data }) {
    return new Promise((_resolve) => {
      const resolve = (data) => {
        setState("editor", "gui", "prompt", false);
        _resolve(data);
      };

      setState("editor", "gui", "prompt", { type, header, data, resolve });
    });
  };
  this.closePrompt = () => setState("editor", "gui", "prompt", false);

  this.setTooltip = (tooltip) => {
    setState("editor", "gui", "tooltip", tooltip);
  };

  this.closeRoleAdmin = () => setState("editor", "gui", "role_admin", false);

  // navigation

  this.zoomIn = (e) => {
    setState("editor", "navigation", "origin", (origin) => ({
      x: origin.x + (0.3 * (origin.x - window.innerWidth)) / 2,
      y: origin.y + (0.3 * (origin.y - window.innerHeight)) / 2,
    }));
    setState("editor", "navigation", "zoom", (zoom) => zoom * 1.3);
    if (new_zoom > 0.4) {
      setState("editor", "bools", "isZoomedOut", false);
    }
  };

  this.zoomOut = (e) => {
    setState("editor", "navigation", "origin", (origin) => ({
      x: origin.x - 0.3 * (origin.x - window.innerWidth / 2),
      y: origin.y - 0.3 * (origin.y - window.innerHeight / 2),
    }));
    setState("editor", "navigation", "zoom", (zoom) => zoom * 0.7);

    if (new_zoom < 0.4) {
      setState("editor", "bools", "isZoomedOut", false);
    }
  };

  this.addToSelectedBlockIds = (block_id) => {
    if (state.editor.selected_block_ids.indexOf(block_id) != -1) return;
    setState(
      "editor",
      "selected_block_ids",
      produce((selected_block_ids) => {
        selected_block_ids.push(block_id);
      })
    );
  };

  this.removeFromSelectedBlockIds = (block_id) => {
    setState(
      "editor",
      "selected_block_ids",
      produce((selected_block_ids) => {
        let index = selected_block_ids.indexOf(block_id);
        if (index === -1) return;
        selected_block_ids.splice(index, 1);
      })
    );
  };

  this.emptySelectedBlockIds = () => {
    setState("editor", "selected_block_ids", []);
  };

  this.updateRoleOffset = ({ block_id, role_id, direction, offset }) => {
    if (!(block_id in state.editor.role_offsets)) {
      setState("editor", "role_offsets", block_id, {});
    }
    if (!(role_id in state.editor.role_offsets[block_id])) {
      setState("editor", "role_offsets", block_id, role_id, {});
    }
    setState("editor", "role_offsets", block_id, role_id, direction, offset);
  };
  this.updateBlockDimension = ({ block_id, dimension }) => {
    setState("editor", "block_dimensions", block_id, dimension);
  };

  this.setConnecting = (bool) =>
    setState("editor", "bools", "isConnecting", bool);

  this.addTemporaryConnection = ({
    block_id,
    role_id,
    next_block_id = false,
    direction,
    cursor,
  }) => {
    if (next_block_id) {
      setState(
        "editor",
        "temporary_connections",
        produce((temporary_connections) => {
          temporary_connections.push({
            block_id,
            next_block_id,
            role_id,
            direction: oppositeDirection(direction),
            cursor,
          });
        })
      );
    } else {
      setState(
        "editor",
        "temporary_connections",
        produce((temporary_connections) => {
          temporary_connections.push({
            block_id,
            role_id,
            direction,
            cursor,
          });
        })
      );
    }
  };

  this.removeTemporaryConnection = ({ block_id, role_id, direction }) => {
    setState("editor", "temporary_connections", (temporary_connections) =>
      temporary_connections.filter(
        (t) =>
          !(
            t.block_id === block_id &&
            t.role_id === role_id &&
            t.direction === direction
          )
      )
    );
  };

  this.navigateToBlockId = (block_id) => {
    let position = state.script.blocks[block_id].position;
    setState("editor", "navigation", "origin", {
      x: position.x * -1 + window.innerWidth / 2 - 900 / 2,
      y: position.y * -1 + 200,
    });

    this.emptySelectedBlockIds();
    this.addToSelectedBlockIds(block_id);
  };

  this.setBool = (bool_type, bool) =>
    setState("editor", "bools", bool_type, bool);

  this.setSubMenu = (type) => setState("editor", "gui", "sub_menu", type);
  this.toggleSubMenu = (type) => {
    setState("editor", "gui", "sub_menu", (prev) => prev !== type ? type : false);
  }

  this.getRoleOffset = ({ block_id, role_id, direction }) =>
    state.editor.role_offsets[block_id] &&
      state.editor.role_offsets[block_id][role_id] &&
      state.editor.role_offsets[block_id][role_id][direction]
      ? state.editor.role_offsets[block_id][role_id][direction]
      : null;
}
