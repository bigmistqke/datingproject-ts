import uniqid from "uniqid";

import getRandomHue from "../helpers/getRandomHue";
import arrayOfObjectsToObject from "../helpers/arrayOfObjectsToObject";

import Bubble from "../components/Bubble";

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
    console.log("setErrorsRoleId", errors);
    // console.log([...editorState.errors]);
    setEditorState("errors", role_id, errors);
    updateErroredBlockIds();
  };

  this.openPrompt = async function ({ type, header, data }) {
    return new Promise((_resolve) => {
      const resolve = (data) => {
        setEditorState("gui", "prompt", false);
        _resolve(data);
      };

      setEditorState("gui", "prompt", { type, header, data, resolve });
    });
  };
  this.openGui = (type) => setEditorState("gui", type, true);
  this.toggleGui = (type) =>
    setEditorState("gui", type, !editorState.gui[type]);

  this.closeGui = (type) => setEditorState("gui", type, false);

  this.closePrompt = () => setEditorState("gui", "prompt", false);
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

  this.addTemporaryConnection = ({ block_id, role_id, direction, cursor }) => {
    // //console.log(block_id, role_id, direction, cursor);
    console.log(
      scriptState.blocks[block_id].roles[role_id][prevOrNext(direction)]
    );
    let next_block_id =
      scriptState.blocks[block_id].roles[role_id][prevOrNext(direction)];
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
    console.log(position.x);
    setEditorState("navigation", "origin", {
      x: position.x * -1 + window.innerWidth / 2 - 900 / 2,
      y: position.y * -1 + 200,
    });

    this.emptySelectedBlockIds();
    this.addToSelectedBlockIds(block_id);
  };
};

const ScriptManager = function ({
  editorManager,
  editorState,
  scriptState,
  setScriptState,
  script_id,
  dataProcessor,
}) {
  let scriptManager = this;
  this.instructions = new (function () {
    const getDefaultInstruction = (role_id) => {
      return {
        script_id: script_id,
        role_id: role_id,
        type: "do",
        text: "",
      };
    };

    this.add = (role_id) => {
      let instruction = getDefaultInstruction(role_id);
      let instruction_id = uniqid();
      //console.log(scriptState.instructions);
      //console.log(instruction_id);
      setScriptState("instructions", instruction_id, instruction);
      //console.log(scriptState.instructions)
      return { instruction, instruction_id };
    };

    this.remove = (instruction_id) => {
      let instructions = scriptState.instructions;
      delete instructions[instruction_id];
      setScriptState("instructions", instructions);
    };

    this.change = (instruction_id, data) => {
      for (let key in data) {
        setScriptState("instructions", instruction_id, key, data[key]);
      }
    };
  })();

  this.blocks = new (function () {
    const updateBlock = (block_id, data) => {
      let block = scriptState.blocks[block_id];
      if (!block) return;

      Object.keys(data).forEach((key) => {
        setScriptState("blocks", block_id, key, data[key]);
      });
    };

    // INTERNAL FUNCTIONS

    const getDefaultBlock = () => {
      return {
        block_id: uniqid(),
        instructions: [],
        roles: {},
        position: {},
      };
    };

    const offsetConnections = ({ block_ids, offset }) => {
      let _connections = connections.map((_connection) => {
        let _pos = [..._connection.pos];
        if (block_ids.includes(_connection.in_block_id)) {
          if (!_pos[0]) {
            console.error(
              "_connection.in_block_id",
              _connection.in_block_id,
              connections
            );
          } else {
            _pos[0].x += offset.x;
            _pos[0].y += offset.y;
          }
        }
        if (block_ids.includes(_connection.out_block_id)) {
          if (!_pos[1]) {
            console.error(
              "_connection.out_block_id",
              _connection.out_block_id,
              connections
            );
          } else {
            _pos[1].x += offset.x;
            _pos[1].y += offset.y;
          }
        }
        _connection.pos = _pos;

        return _connection;
      });
      setConnections(_connections);
    };

    const removeBlock = (block_id) => {
      console.log("removeBlock", block_id);
      /* // remove from selection
            let index = editorState.selected_block_ids.indexOf(block_id);
            if (index != -1) {
                setEditorState("selected_block_ids", editorState.selected_block_ids.splice(index, 1));
            } */
      let blocks = { ...scriptState.blocks };
      let block = scriptState.blocks[block_id];

      // remove all instructions that are a part of block
      let instructions = { ...scriptState.instructions };
      block.instructions.forEach((instruction_id) => {
        delete instructions[instruction_id];
      });
      setScriptState("instructions", instructions);

      let roles = block.roles;

      // remove reference to block in connected blocks
      Object.entries(roles).forEach(([role_id, role]) => {
        if (role.next_block_id != null) {
          setConnection({
            block_id: role.next_block_id,
            connecting_block_id: null,
            role_id,
            direction: "in",
          });
          // setScriptState("blocks", role.next_block_id, "roles", role_id, "prev_block_id", null);
        }
        if (role.prev_block_id != null) {
          // setScriptState("blocks", role.prev_block_id, "roles", role_id, "next_block_id", null);
          setConnection({
            block_id: role.prev_block_id,
            connecting_block_id: null,
            role_id,
            direction: "out",
          });
        }
        console.log(role.next_block_id, role_id);
      });

      // remove block
      delete blocks[block_id];
      let object = {};
      setScriptState({ ...scriptState, blocks });
      setTimeout(() => {
        console.log(scriptState.blocks);
      }, 500);
    };

    const setConnection = ({
      block_id,
      connecting_block_id,
      role_id,
      direction,
    }) => {
      setScriptState("blocks", block_id, "roles", {
        ...scriptState.blocks[block_id].roles,
        [role_id]: {
          ...scriptState.blocks[block_id].roles[role_id],
          [prevOrNext(direction)]: connecting_block_id,
        },
      });
      // dataProcessor.controlRole(role_id);
      // maybe better to call them in the methods instead of internal to optimize control-calls
    };

    // METHODS

    this.add = () => {
      let block = getDefaultBlock();
      block.position = {
        x:
          editorState.navigation.cursor.x -
          editorState.navigation.origin.x -
          450,
        y: editorState.navigation.cursor.y - editorState.navigation.origin.y,
      };
      setScriptState("blocks", block.block_id, block);
    };

    this.removeSelectedBlocks = () => {
      // console.error("removeSelectedBlocks is not yet implemented");
      editorState.selected_block_ids.forEach((block_id) => {
        removeBlock(block_id);
      });
    };

    this.addRole = ({ block_id, role_id }) => {
      if (Object.keys(scriptState.blocks[block_id].roles).length === 0) {
        let instruction_id = scriptManager.instructions.add(role_id);
        this.addInstructionId({ block_id, instruction_id });
      }

      setScriptState("blocks", block_id, "roles", role_id, {
        role_id,
        block_id,
        prev_block_id: null,
        next_block_id: null,
      });
      dataProcessor.controlRole(role_id);
    };

    this.removeRole = ({ block_id, role_id }) => {
      let instruction_ids = scriptState.blocks[block_id].instructions;
      let instructions = scriptState.instructions;

      // remove from block.instructions
      instruction_ids = instruction_ids.filter(
        (instruction_id) => instructions[instruction_id].role_id !== role_id
      );
      setScriptState("blocks", block_id, {
        ...scriptState.blocks[block_id],
        instructions: instruction_ids,
      });

      // remove from scriptState.instructions
      instruction_ids.forEach((instruction_id) => {
        delete instructions[instruction_id];
      });
      setScriptState("instructions", { ...instructions });

      // remove block_id from the roles' connected blocks
      let roles = { ...scriptState.blocks[block_id].roles };
      let role = { ...roles[role_id] };

      // remove from roles
      delete roles[role_id];
      setScriptState("blocks", block_id, {
        ...scriptState.blocks[block_id],
        roles,
      });

      // null next_block_id from connected prev_block
      if (role.prev_block_id) {
        let prev_roles = { ...scriptState.blocks[role.prev_block_id].roles };
        let prev_role = { ...prev_roles[role_id] };
        prev_role.next_block_id = null;
        setScriptState("blocks", role.prev_block_id, "roles", {
          ...prev_roles,
          [role_id]: prev_role,
        });
      }

      // null prev_block_id from connected next_block
      if (role.next_block_id) {
        let next_roles = { ...scriptState.blocks[role.next_block_id].roles };
        let next_role = { ...next_roles[role_id] };
        next_role.prev_block_id = null;
        setScriptState("blocks", role.next_block_id, "roles", {
          ...next_roles,
          [role_id]: next_role,
        });
      }
    };

    this.convertRole = ({ block_id, source_role_id, target_role_id }) => {
      let instruction_ids = scriptState.blocks[block_id].instructions;
      let instructions = { ...scriptState.instructions };

      instruction_ids.forEach((instruction_id) => {
        if (instructions[instruction_id].role_id !== source_role_id) return;
        setScriptState(
          "instructions",
          instruction_id,
          "role_id",
          target_role_id
        );
      });

      // remove block_id from the roles' connected blocks
      let roles = { ...scriptState.blocks[block_id].roles };

      // remove from roles
      delete roles[source_role_id];
      setScriptState("blocks", block_id, {
        ...scriptState.blocks[block_id],
        roles,
      });
      dataProcessor.controlRole(source_role_id);
    };

    this.selectBlock = (block_id) => {
      setScriptState("blocks", block_id, "meta", "selected", true);
      editorManager.addToSelectedBlockIds(block_id);
    };

    this.deselectBlock = (block_id) => {
      setScriptState("blocks", block_id, "meta", "selected", true);
      editorManager.removeFromSelectedBlockIds(block_id);
    };

    this.deselectAllBlocks = () => {
      editorState.selected_block_ids.forEach((selected_block_id) =>
        this.deselectBlock(selected_block_id)
      );
    };

    this.addInstructionId = ({
      block_id,
      instruction_id,
      prev_instruction_id = false,
    }) => {
      let instruction_ids = [...scriptState.blocks[block_id].instructions];
      if (prev_instruction_id) {
        let prev_instruction_index =
          instruction_ids.indexOf(prev_instruction_id);
        instruction_ids.splice(prev_instruction_index + 1, 0, instruction_id);
      } else {
        instruction_ids.push(instruction_id);
      }
      setScriptState("blocks", block_id, "instructions", instruction_ids);
    };

    this.removeInstructionId = ({ block_id, instruction_id }) => {
      let instruction_ids = [...scriptState.blocks[block_id].instructions];
      let instruction_index = instruction_ids.indexOf(instruction_id);
      instruction_ids.splice(instruction_index, 1);
      setScriptState("blocks", block_id, "instructions", instruction_ids);
    };

    // const GRID_SIZE = 10;

    this.translateSelectedBlocks = ({ offset }) => {
      let block, position;
      editorState.selected_block_ids.forEach((block_id) => {
        block = scriptState.blocks[block_id];
        position = {
          x: block.position.x + offset.x,
          y: block.position.y + offset.y,
        };
        /* position = {
                    x: parseInt((block.position.x + offset.x) / GRID_SIZE) * GRID_SIZE,
                    y: block.position.y + offset.y
                } */

        updateBlock(block_id, { position });
      });
    };

    this.addConnection = ({
      block_id,
      connecting_block_id,
      role_id,
      direction,
    }) => {
      // check if connecting_block_id.roles[role_id][opposite_direction] is already connected to a block_id
      // if yes: remove reference to connecting_block_id from connecting_block_id.roles[role_id][opposite_direction]
      let opposite_direction = oppositeDirection(direction);

      if (
        scriptState.blocks[connecting_block_id].roles[role_id][
        prevOrNext(opposite_direction)
        ]
      ) {
        setConnection({
          block_id:
            scriptState.blocks[connecting_block_id].roles[role_id][
            prevOrNext(opposite_direction)
            ],
          connecting_block_id: null,
          role_id,
          direction,
        });
      }

      setConnection({
        block_id,
        connecting_block_id,
        role_id,
        direction,
      });
      setConnection({
        block_id: connecting_block_id,
        connecting_block_id: block_id,
        role_id,
        direction: opposite_direction,
      });
    };

    this.removeConnection = ({ block_id, role_id, direction }) => {
      // //console.log(scriptState.blocks[block_id].roles[role_id]);
      let prev_or_next = prevOrNext(direction);
      let connecting_block_id =
        scriptState.blocks[block_id].roles[role_id][prev_or_next];
      //console.log(connecting_block_id);
      if (connecting_block_id) {
        setConnection({
          block_id: connecting_block_id,
          connecting_block_id: null,
          role_id,
          direction: direction === "out" ? "in" : "out",
        });
      }

      setConnection({
        block_id,
        connecting_block_id: null,
        role_id,
        direction,
      });
    };

    this.hasRoleId = ({ block_id, role_id }) =>
      role_id in scriptState.blocks[block_id].roles;
  })();

  this.roles = new (function () {
    const getRoleLength = () => Object.keys(scriptState.roles).length;
    const getDefaultRole = () => {
      const hue = getRandomHue(getRoleLength() + 1).toString();
      return {
        instruction_ids: [],
        description: "",
        hue,
      };
    };

    this.add = () => {
      let role_id = getRoleLength() + 1;
      setScriptState("roles", role_id, getDefaultRole());
    };

    this.remove = async (role_id) => {
      // check if role has any instructions associated with it
      let instructions_without_role = Object.entries(scriptState.instructions).map(
        ([instruction_id, instruction]) => instruction.role_id !== role_id
      );
      if (instructions_without_role.length < scriptState.instructions.length) {
        // remove instructions + references to role from blocks
        Object.entries(scriptState.blocks).forEach(([block_id, block]) => {
          if (Object.keys(block.roles).indexOf(role_id) != -1) return;
          block = { ...block };
          delete block.roles[role_id];
          block.instructions = block.instructions.map((instruction_id, index) =>
            scriptState.instructions[instruction_id].role_id != role_id
          )
          setScriptState("blocks", block_id, block);
        })
      }

      // remove all instructions with role_id
      // setScriptState("instructions", { ...arrayOfObjectsToObject(instructions_without_role) });

    }


    /*      let role_id = getRoleLength() + 1;
               setScriptState("roles", role_id, getDefaultRole()); */


    this.setDescription = ({ role_id, description }) => {
      setScriptState("roles", role_id, "description", description);
    };
    this.setAmount = (amount) => {
      console.error("roles.setAmount is not yet implemented");
      if (amount < Object.values(scriptState.roles)) {
        // check if roles has instructions associated with it;
      }
    };
  })();

  this.description = new (function () {
    this.set = (description) => setScriptState("description", description);
  })();
};

const StoreManager = function ({
  scriptState,
  setScriptState,
  editorState,
  setEditorState,
  script_id,
  dataProcessor,
}) {
  this.editor = new EditorManager({
    storeManager: this,
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

  this.controlRole = async (role_id) =>
    this.editor.setErrorsRoleId({
      role_id,
      errors: await dataProcessor.controlRole(role_id),
    });
};

export default StoreManager;
