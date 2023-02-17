import { produce } from "solid-js/store";

import reverseDirection from "../helpers/reverseDirection";
import { useNavigate } from "solid-app-router";

export default function EditorActions({ state, setState, actions }) {
  const navigate = useNavigate();

  //// INTERNALS

  const updateErroredNodeIds = () => {
    let node_ids = [];
    Object.values(state.editor.errors).forEach((errors) => {
      errors.forEach((error) => {
        if (!error.node_ids) return;
        error.node_ids.forEach((node_id) => {
          if (node_ids.indexOf(node_id) !== -1) return;
          node_ids.push(node_id);
        });
      });
    });

    setState("editor", "errored_node_ids", node_ids);
  };

  //// PUBLIC FUNCTIONS
  this.setCursor = (cursor) =>
    setState("editor", "navigation", "cursor", cursor);

  this.getCursor = () => state.editor.navigation.cursor;

  this.setSelectionBox = (selection_box) =>
    setState("editor", "gui", "selectionBox", selection_box);
  this.getSelectionBox = (selection_box) => state.editor.gui.selectionBox;

  this.getOrigin = () => state.editor.navigation.origin
  this.getOriginGrid = () => state.editor.navigation.origin_grid

  this.setOrigin = (origin) => {
    setState("editor", "navigation", "origin", origin);
    updateOriginGrid();
  };

  this.offsetOrigin = (delta) => {
    setState("editor", "navigation", "origin", (origin) => {
      return {
        x: origin.x + delta.x,
        y: origin.y + delta.y
      }
    });
    updateOriginGrid();
  };

  const updateOriginGrid = () => {
    setState("editor", "navigation", "origin_grid", 0, "x",
      parseInt(
        state.editor.navigation.origin.x /
        (this.getZoom() * state.editor.navigation.grid_size)
      ) * -1
    );
    setState("editor", "navigation", "origin_grid", 0, "y",
      parseInt(
        state.editor.navigation.origin.y /
        (this.getZoom() * state.editor.navigation.grid_size)
      ) * -1
    );
    setState("editor", "navigation", "origin_grid", 1, "x",
      parseInt(
        (state.editor.navigation.origin.x * -1 + window.innerWidth) /
        (this.getZoom() * state.editor.navigation.grid_size)
      )
    );
    setState("editor", "navigation", "origin_grid", 1, "y",
      parseInt(
        (state.editor.navigation.origin.y * -1 + window.innerHeight) /
        (this.getZoom() * state.editor.navigation.grid_size)
      )
    );
    //   state.editor.navigation.origin_grid[1].x, state.editor.navigation.origin_grid[1].y)
  }
  this.getZoom = () => state.editor.navigation.zoom;



  this.setErrorsRoleId = ({ role_id, errors }) => {
    setState("editor", "errors", role_id, errors);
    updateErroredNodeIds();
  };

  this.openGui = (type) => setState("editor", "gui", type, true);
  this.closeGui = (type) => setState("editor", "gui", type, false);
  this.toggleGui = (type) => setState("editor", "gui", type, (bool) => !bool);

  this.openPrompt = async function ({ type, header, data, position }) {
    return new Promise((_resolve) => {
      const resolve = (data) => {
        setState("editor", "gui", "prompt", false);
        _resolve(data);
      };

      setState("editor", "gui", "prompt", { type, header, data, position, resolve });
    });
  };
  this.closePrompt = () => setState("editor", "gui", "prompt", false);

  this.setTooltip = (tooltip) => {
    setState("editor", "gui", "tooltip", tooltip);
  };

  this.closeRoleAdmin = () => setState("editor", "gui", "role_admin", false);

  // navigation


  const calcPositionOffsetZoom = (axis, delta) =>
    this.getOrigin()[axis] + delta * (this.getOrigin()[axis] - this.getCursor()[axis])

  const updateZoomedOut = () => {
    if (this.getZoom() > 0.2) {
      setState("editor", "bools", "isZoomedOut", false);
    } else {
      setState("editor", "bools", "isZoomedOut", true);
    }
  }

  const zoom_range = { min: 0.0125, max: 1 }
  const limitZoom = (zoom) => Math.min(zoom_range.max, Math.max(zoom_range.min, zoom))

  const updateZoomState = (zoom, delta) => {
    let new_zoom = limitZoom(zoom + delta);
    if (new_zoom !== zoom) {
      setState("editor", "navigation", "origin", (origin) => ({
        x: calcPositionOffsetZoom("x", delta / this.getZoom()),
        y: calcPositionOffsetZoom("y", delta / this.getZoom()),
      }));
      updateOriginGrid();
      updateZoomedOut();
    }
    return new_zoom;
  }

  this.offsetZoom = (delta) => {
    setState("editor", "navigation", "zoom", (zoom) => updateZoomState(zoom, delta));
  };

  this.zoomIn = (e) => {
    setState("editor", "navigation", "zoom", (zoom) => updateZoomState(zoom, zoom * 0.3));
  };



  this.zoomOut = (e) => {
    setState("editor", "navigation", "zoom", (zoom) => updateZoomState(zoom, zoom * -0.3));
  };

  this.addToSelection = (node_ids) => {
    if (!Array.isArray(node_ids))
      node_ids = [node_ids]

    setState(
      "editor",
      "selection",
      (selection) => [...selection, ...node_ids.filter(node_id => selection.indexOf(node_id) === -1)]
    )
  };

  this.removeFromSelection = (node_ids) => {
    if (!Array.isArray(node_ids))
      node_ids = [node_ids]

    setState(
      "editor",
      "selection",
      (selection) => selection.filter(node_id => node_ids.indexOf(node_id) === -1)
    )
  };

  this.emptySelection = () => setState("editor", "selection", []);

  this.emptyRoleOffset = () => setState("editor", "role_offsets", {})

  this.updateRoleOffset = ({ node_id, role_id, direction, offset }) => {
    if (!(node_id in state.editor.role_offsets)) {
      setState("editor", "role_offsets", node_id, {});
    }
    if (!(role_id in state.editor.role_offsets[node_id])) {
      setState("editor", "role_offsets", node_id, role_id, {});
    }
    setState("editor", "role_offsets", node_id, role_id, direction, offset);
  };

  this.setConnecting = (bool) =>
    setState("editor", "bools", "isConnecting", bool);

  this.addTemporaryConnection = ({
    node_id,
    role_id,
    out_node_id = false,
    direction,
    cursor,
  }) => {
    if (out_node_id) {
      setState(
        "editor",
        "temporary_connections",
        produce((temporary_connections) => {
          temporary_connections.push({
            node_id,
            out_node_id,
            role_id,
            direction: reverseDirection(direction),
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
            node_id,
            role_id,
            direction,
            cursor,
          });
        })
      );
    }
  };

  this.removeTemporaryConnection = ({ node_id, role_id, direction }) => {
    setState("editor", "temporary_connections", (temporary_connections) =>
      temporary_connections.filter(
        (t) =>
          !(
            t.node_id === node_id &&
            t.role_id === role_id &&
            t.direction === direction
          )
      )
    );
  };

  this.navigateToNodeId = (node_id) => {
    let position = state.script.nodes[node_id].position;
    setState("editor", "navigation", "origin", {
      x: position.x * -1 + window.innerWidth / 2 - 900 / 2,
      y: position.y * -1 + 200,
    });

    this.emptySelection();
    this.addToSelection(node_id);
  };

  this.setBool = (bool_type, bool) =>
    setState("editor", "bools", bool_type, bool);

  this.setSubMenu = (type) => setState("editor", "gui", "sub_menu", type);
  this.toggleSubMenu = (type) => {
    setState("editor", "gui", "sub_menu", (prev) => prev !== type ? type : false);
  }

  this.getRoleOffset = ({ node_id, role_id, direction }) => {


    return state.editor.role_offsets[node_id] &&
      state.editor.role_offsets[node_id][role_id] &&
      state.editor.role_offsets[node_id][role_id][direction]
      ? state.editor.role_offsets[node_id][role_id][direction]
      : null;
  }

  this.enterGroup = (group_id) => {
    let parent_id = state.script.groups[group_id].parent;
    setState("editor", "visited_parent_ids", (ids) => [...ids, group_id]);

    let url = group_id ?
      `/${state.script.script_id}/${state.editor.visited_parent_ids.join("/")}` :
      `/${state.script.script_id}`;



    navigate(url);
    this.emptySelection();
    this.emptyRoleOffset();
  }
  this.enterVisitedGroup = ({ group_id, index }) => {

    setState("editor", "visited_parent_ids", (ids) => ids.slice(0, index));

    let url = group_id ?
      `/${state.script.script_id}/${state.editor.visited_parent_ids.join("/")}` :
      `/${state.script.script_id}`;

    navigate(url);
    this.emptySelection();
    this.emptyRoleOffset();
  }

  this.initWindowInteractions = () => {
    const mousemove = (e) => this.setCursor({ x: e.clientX, y: e.clientY });

    const keydown = (e) => {
      if (state.editor.bools.isCtrlPressed || e.metaKey) {
        switch (e.code) {
          case "KeyD":
            e.preventDefault();
            actions.duplicateSelectedNodes({
              cursor,
              zoom: props.zoom,
            });
            break;
          case "ArrowUp":
            e.preventDefault();
            this.zoomIn();
            break;
          case "ArrowDown":
            e.preventDefault();
            this.zoomOut();
            break;
        }
      } else {
        switch (e.key) {
          case "Backspace":
            // actions.deleteSelectedNodes();
            break;
          case "Control":
            this.setBool("isCtrlPressed", true);
            break;
          case "Shift":
            this.setBool("isShiftPressed", true);
            break;
        }
      }
    };

    const keyup = (e) => {
      if (state.editor.bools.isCtrlPressed && !e.ctrlKey) {
        this.setBool("isCtrlPressed", false);
      }
      if (state.editor.bools.isShiftPressed && !e.shiftKey) {
        this.setBool("isShiftPressed", false);
      }
    };

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("mousemove", mousemove);
  }
}
