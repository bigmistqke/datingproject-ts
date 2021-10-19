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

    this.addInstruction = (role_id) => {
      let instruction = getDefaultInstruction(role_id);
      let instruction_id = uniqid();
      setScriptState("instructions", instruction_id, instruction);
      return { instruction, instruction_id };
    };

    this.removeInstruction = (instruction_id) => {
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
      let block = scriptState.blocks[block_id];

      // remove all instructions that are a part of block
      block.instructions.forEach((instruction_id) => {
        // delete instructions[instruction_id];
        setScriptState("instructions", instruction_id, undefined);
      });

      let roles = { ...block.roles };
      let role_ids = Object.keys(roles);

      // remove reference to block in connected blocks
      Object.entries(roles).forEach(([role_id, role]) => {
        if (role.next_block_id != undefined) {
          setConnection({
            block_id: role.next_block_id,
            connecting_block_id: undefined,
            role_id,
            direction: "in",
          });
        }
        if (role.prev_block_id != undefined) {
          setConnection({
            block_id: role.prev_block_id,
            connecting_block_id: undefined,
            role_id,
            direction: "out",
          });
        }
      });

      setScriptState("blocks", block_id, undefined);
      return { role_ids }
    };

    const setConnection = ({
      block_id,
      connecting_block_id,
      role_id,
      direction,
    }) => {

      setScriptState("blocks", block_id, "roles", role_id, prevOrNext(direction),
        connecting_block_id);

    };

    // METHODS

    this.addBlock = () => {
      let block = getDefaultBlock();
      block.position = {
        x:
          editorState.navigation.cursor.x -
          editorState.navigation.origin.x -
          450,
        y: editorState.navigation.cursor.y - editorState.navigation.origin.y,
      };
      setScriptState("blocks", block.block_id, block);
      return block.block_id;
    };

    this.removeSelectedBlocks = () => {
      // console.error("removeSelectedBlocks is not yet implemented");
      let all_affected_role_ids = [];
      editorState.selected_block_ids.forEach((block_id) => {
        let { role_ids } = removeBlock(block_id);
        role_ids.forEach(role_id => {
          if (all_affected_role_ids.indexOf(role_id) !== -1) return;
          all_affected_role_ids = [...all_affected_role_ids, ...role_id];
        })
      });
      return { role_ids: all_affected_role_ids }
    };

    this.addRole = ({ block_id, role_id }) => {
      if (Object.keys(scriptState.blocks[block_id].roles).length === 0) {
        let { instruction_id } = scriptManager.instructions.addInstruction(role_id);
        this.addInstructionId({ block_id, instruction_id });
      }

      setScriptState("blocks", block_id, "roles", role_id, {
        role_id,
        block_id
      });
      dataProcessor.controlRole(role_id);
    };

    this.removeRole = ({ block_id, role_id }) => {
      let instruction_ids = scriptState.blocks[block_id].instructions.filter(instruction_id =>
        scriptState.instructions[instruction_id].role_id === role_id
      );

      // remove block_id from the roles' connected blocks
      let roles = scriptState.blocks[block_id].roles;
      let role = roles[role_id];

      if (Object.keys(roles).length > 1) {
        // null next_block_id from connected prev_block
        if (role.prev_block_id) {
          this.removeConnectionBothWays({
            block_id,
            role_id,
            direction: "in"
          })
        }

        // null prev_block_id from connected next_block
        if (role.next_block_id) {
          this.removeConnectionBothWays({
            block_id,
            role_id,
            direction: "out"
          })
        }
        // remove all instructions from block with role_id
        setScriptState("blocks", block_id, "instructions",
          scriptState.blocks[block_id].instructions.filter(instruction_id =>
            scriptState.instructions[instruction_id].role_id !== role_id)
        );

        // remove role_id from roles
        setScriptState("blocks", block_id, "roles", role_id, undefined);

      } else {
        // remove block completely
        removeBlock(block_id);
      }

      // remove from scriptState.instructions
      instruction_ids.forEach((instruction_id) => {
        setScriptState("instructions", instruction_id, undefined);
      });
    };

    this.convertRole = ({ block_id, source_role_id, target_role_id }) => {
      scriptState.blocks[block_id].instructions.forEach((instruction_id) => {
        if (scriptState.instructions[instruction_id].role_id !== source_role_id) return;
        setScriptState("instructions", instruction_id, "role_id", target_role_id);
      });

      this.removeRole({ block_id, role_id: source_role_id })
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
      index = false
    }) => {
      let instruction_ids = [...scriptState.blocks[block_id].instructions];
      if (index) {
        setScriptState("blocks", block_id, "instructions",
          array_insert(instruction_ids, index, instruction_id)
        );
      } else {
        setScriptState("blocks", block_id, "instructions", [...instruction_ids, instruction_id]);
      }
    };

    this.removeInstructionId = ({ block_id, instruction_id, index }) => {
      setScriptState("blocks", block_id, "instructions",
        array_remove_element(scriptState.blocks[block_id].instructions, instruction_id)
      );
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
      const opposite_direction = oppositeDirection(direction);

      let block_id_initially_connected_to_connecting_block =
        scriptState.blocks[connecting_block_id].roles[role_id][
        prevOrNext(opposite_direction)
        ]

      if (block_id_initially_connected_to_connecting_block) {
        // dereference connecting_block at block initially connected to connecting_block
        setConnection({
          block_id: block_id_initially_connected_to_connecting_block,
          connecting_block_id: undefined,
          role_id,
          direction
        });
      }
      // make reference to connecting_block_id at this block.roles[role_id]
      setConnection({
        block_id,
        connecting_block_id,
        role_id,
        direction,
      });
      // make reference to block_id at connecting_block_id.roles[role_id]
      setConnection({
        block_id: connecting_block_id,
        connecting_block_id: block_id,
        role_id,
        direction: opposite_direction,
      });
    };

    this.removeConnectionBothWays = ({ block_id, role_id, direction }) => {
      let connecting_block_id =
        scriptState.blocks[block_id].roles[role_id][prevOrNext(direction)];

      if (connecting_block_id) {
        // dereference this block_id at initial_connecting_block.roles[role_id][opposite_direciton]
        setConnection({
          block_id: connecting_block_id,
          connecting_block_id: undefined,
          role_id,
          direction: oppositeDirection(direction),
        });
      }
      // dereference block.roles[role_id][direction]
      setConnection({
        block_id,
        connecting_block_id: undefined,
        role_id,
        direction,
      });
    };

    this.hasRoleId = ({ block_id, role_id }) =>
      role_id in scriptState.blocks[block_id].roles;

  })();

  this.roles = new (function () {
    const getRoleLength = () => Object.keys(scriptState.roles).length;

    const getInitialName = () => {
      let highest_integer = 0;
      let is_name_an_int;
      let parsed_name;
      Object.entries(scriptState.roles).forEach(([role_id, role]) => {
        parsed_name = parseInt(role.name);
        is_name_an_int = parsed_name == role.name;
        if (is_name_an_int && parsed_name > highest_integer) {
          highest_integer = parsed_name;
        }
      })
      return highest_integer + 1;
    }
    const getDefaultRole = () => {
      const name = getInitialName();
      const hue = getRandomHue(name).toString();
      return {
        instruction_ids: [],
        description: "",
        hue,
        name
      };
    };

    this.addRole = () => {
      setScriptState("roles", uniqid(), getDefaultRole());
    };

    this.remove = async (role_id) => {


      Object.entries(scriptState.blocks).forEach(([block_id, block]) => {
        if (Object.keys(block.roles).indexOf(role_id) == -1) return;
        scriptManager.blocks.removeRole({ block_id, role_id });
      })

      // check if role has any instructions associated with it



      /*  let instructions_without_role = Object.entries(scriptState.instructions).filter(
         ([instruction_id, instruction]) => instruction.role_id != role_id
       );
   
       if (instructions_without_role.length < Object.keys(scriptState.instructions).length) {
         // remove instructions + references to role from blocks
         Object.entries(scriptState.blocks).forEach(([block_id, block]) => {
           if (Object.keys(block.roles).indexOf(role_id) == -1) return;
           scriptManager.blocks.removeRole({ block_id, role_id });
         })
       }
   
       // remove all instructions with role_id
       setScriptState("instructions", { ...arrayOfObjectsToObject(instructions_without_role) }); */
      // remove from roles
      let roles = { ...scriptState.roles };
      delete roles[role_id];

      setScriptState({
        blocks: scriptState.blocks,
        instructions: scriptState.instructions,
        roles: { ...roles }
      });
    }

    this.setName = ({ role_id, name }) => {
      if (name === "") return;
      setScriptState("roles", role_id, "name", name);
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
