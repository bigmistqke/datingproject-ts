import uniqid from "uniqid";
import { array_insert, array_remove_element } from "../helpers/Pure";

import getRandomHue from "../helpers/getRandomHue";
import arrayOfObjectsToObject from "../helpers/arrayOfObjectsToObject";

import Uploader from "../helpers/Uploader";
import urls from "../urls";



export default function ScriptActions({
  state,
  setState,
  actions
}) {
  // let scriptManager = this;

  this.setInstructions = (instructions) =>
    setState("script", "instructions", instructions);
  this.setRoles = (roles) => setState("script", "roles", roles);
  this.setBlocks = (blocks) => setState("script", "blocks", blocks);
  this.setScriptId = (script_id) => setState("script", "script_id", script_id);

  //

  const prevOrNext = (direction) =>
    direction === "out" ? "next_block_id" : "prev_block_id";
  const oppositeDirection = (direction) => (direction === "out" ? "in" : "out");

  //// INSTRUCTIONS

  const getDefaultInstruction = (role_id) => {
    return {
      script_id: state.script.script_id,
      role_id: role_id,
      type: "do",
      text: "",
    };
  };

  this.addInstruction = (role_id) => {
    let instruction = getDefaultInstruction(role_id);
    let instruction_id = uniqid();
    setState("script", "instructions", instruction_id, instruction);
    return { instruction, instruction_id };
  };

  this.removeInstruction = (instruction_id) => {
    console.log("REMOVE INSTRUCTION!!!!");
    let instructions = { ...state.script.instructions };
    instructions[instruction_id] = undefined;
    setState("script", "instructions", instructions);
  };

  this.setInstruction = (instruction_id, data) => {
    for (let key in data) {
      setState("script", "instructions", instruction_id, key, data[key]);
    }
  };

  //// BLOCKS

  const updateBlock = (block_id, data) => {
    let block = state.script.blocks[block_id];
    if (!block) return;

    Object.keys(data).forEach((key) => {
      setState("script", "blocks", block_id, key, data[key]);
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
    let block = state.script.blocks[block_id];

    // remove all instructions that are a part of block
    block.instructions.forEach((instruction_id) => {
      // delete instructions[instruction_id];
      setState("script", "instructions", instruction_id, undefined);
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

    setState("script", "blocks", block_id, undefined);
    return { role_ids };
  };

  const setConnection = ({
    block_id,
    connecting_block_id,
    role_id,
    direction,
  }) => {
    setState("script",
      "blocks",
      block_id,
      "roles",
      role_id,
      prevOrNext(direction),
      connecting_block_id
    );
  };

  // METHODS

  this.addBlock = () => {
    let block = getDefaultBlock();
    block.position = {
      x:
        state.editor.navigation.cursor.x - state.editor.navigation.origin.x - 450,
      y: state.editor.navigation.cursor.y - state.editor.navigation.origin.y,
    };
    setState("script", "blocks", block.block_id, block);
    return block.block_id;
  };

  this.removeSelectedBlocks = () => {
    // console.error("removeSelectedBlocks is not yet implemented");
    let all_affected_role_ids = [];
    state.editor.selected_block_ids.forEach((block_id) => {
      let { role_ids } = removeBlock(block_id);
      role_ids.forEach((role_id) => {
        if (all_affected_role_ids.indexOf(role_id) !== -1) return;
        all_affected_role_ids = [...all_affected_role_ids, ...role_id];
      });
    });
    return { role_ids: all_affected_role_ids };
  };

  this.addRoleToBlock = ({ block_id, role_id }) => {
    if (Object.keys(state.script.blocks[block_id].roles).length === 0) {
      let { instruction_id } = this.addInstruction(role_id);
      this.addInstructionId({ block_id, instruction_id });
    }

    setState("script", "blocks", block_id, "roles", role_id, {
      role_id,
      block_id,
    });
    this.controlRole(role_id);
  };

  this.removeRoleFromBlock = ({ block_id, role_id }) => {
    let instruction_ids = state.script.blocks[block_id].instructions.filter(
      (instruction_id) =>
        state.script.instructions[instruction_id].role_id === role_id
    );

    // remove block_id from the roles' connected blocks
    let roles = state.script.blocks[block_id].roles;
    let role = roles[role_id];

    if (Object.keys(roles).length > 1) {
      // null next_block_id from connected prev_block
      if (role.prev_block_id) {
        this.removeConnectionBothWays({
          block_id,
          role_id,
          direction: "in",
        });
      }

      // null prev_block_id from connected next_block
      if (role.next_block_id) {
        this.removeConnectionBothWays({
          block_id,
          role_id,
          direction: "out",
        });
      }
      // remove all instructions from block with role_id
      setState("script",
        "blocks",
        block_id,
        "instructions",
        state.script.blocks[block_id].instructions.filter(
          (instruction_id) =>
            state.script.instructions[instruction_id].role_id !== role_id
        )
      );

      // remove role_id from roles
      setState("script", "blocks", block_id, "roles", role_id, undefined);
    } else {
      // remove block completely
      removeBlock(block_id);
    }

    // remove from state.script.instructions
    instruction_ids.forEach((instruction_id) => {
      setState("script", "instructions", instruction_id, undefined);
    });
  };

  this.convertRole = ({ block_id, source_role_id, target_role_id }) => {
    state.script.blocks[block_id].instructions.forEach((instruction_id) => {
      if (state.script.instructions[instruction_id].role_id !== source_role_id)
        return;
      setState("script", "instructions", instruction_id, "role_id", target_role_id);
    });

    this.removeRoleFromBlock({ block_id, role_id: source_role_id });
  };

  this.selectBlock = (block_id) => {
    setState("script", "blocks", block_id, "meta", "selected", true);
    actions.addToSelectedBlockIds(block_id);
  };

  this.deselectBlock = (block_id) => {
    setState("script", "blocks", block_id, "meta", "selected", true);
    actions.removeFromSelectedBlockIds(block_id);
  };

  this.deselectAllBlocks = () => {
    state.editor.selected_block_ids.forEach((selected_block_id) =>
      this.deselectBlock(selected_block_id)
    );
  };

  this.addInstructionId = ({ block_id, instruction_id, index = false }) => {
    let instruction_ids = [...state.script.blocks[block_id].instructions];
    if (index) {
      setState("script",
        "blocks",
        block_id,
        "instructions",
        array_insert(instruction_ids, index, instruction_id)
      );
    } else {
      setState("script", "blocks", block_id, "instructions", [
        ...instruction_ids,
        instruction_id,
      ]);
    }
  };

  this.removeInstructionId = ({ block_id, instruction_id, index }) => {
    console.log([...state.script.blocks[block_id].instructions], instruction_id);
    setState("script",
      "blocks",
      block_id,
      "instructions",
      array_remove_element(
        state.script.blocks[block_id].instructions,
        instruction_id
      )
    );
  };

  this.translateSelectedBlocks = ({ offset }) => {
    let block, position;
    state.editor.selected_block_ids.forEach((block_id) => {
      block = state.script.blocks[block_id];
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
      state.script.blocks[connecting_block_id].roles[role_id] &&
      state.script.blocks[connecting_block_id].roles[role_id][prevOrNext(opposite_direction)];

    if (block_id_initially_connected_to_connecting_block) {
      // dereference connecting_block at block initially connected to connecting_block
      setConnection({
        block_id: block_id_initially_connected_to_connecting_block,
        connecting_block_id: undefined,
        role_id,
        direction,
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
      state.script.blocks[block_id].roles[role_id][prevOrNext(direction)];

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
    role_id in state.script.blocks[block_id].roles;

  ////

  this.instructions = new (function () { })();

  this.blocks = new (function () { })();

  // this.roles = new (function () {
  const getRoleLength = () => Object.keys(state.script.roles).length;

  const getInitialName = () => {
    let highest_integer = 0;
    let is_name_an_int;
    let parsed_name;
    Object.entries(state.script.roles).forEach(([role_id, role]) => {
      parsed_name = parseInt(role.name);
      is_name_an_int = parsed_name == role.name;
      if (is_name_an_int && parsed_name > highest_integer) {
        highest_integer = parsed_name;
      }
    });
    return highest_integer + 1;
  };
  const getDefaultRole = () => {
    const name = getInitialName();
    const hue = getRandomHue(name).toString();
    return {
      instruction_ids: [],
      description: "",
      hue,
      name,
    };
  };

  this.addRoleToScript = () => {
    setState("script", "roles", uniqid(), getDefaultRole());
  };

  this.removeRoleFromScript = async (role_id) => {
    Object.entries(state.script.blocks).forEach(([block_id, block]) => {
      if (Object.keys(block.roles).indexOf(role_id) == -1) return;
      removeRoleFromBlock({ block_id, role_id });
    });

    // check if role has any instructions associated with it

    /*  let instructions_without_role = Object.entries(state.script.instructions).filter(
         ([instruction_id, instruction]) => instruction.role_id != role_id
       );
   
       if (instructions_without_role.length < Object.keys(state.script.instructions).length) {
         // remove instructions + references to role from blocks
         Object.entries(state.script.blocks).forEach(([block_id, block]) => {
           if (Object.keys(block.roles).indexOf(role_id) == -1) return;
           scriptManager.blocks.removeRoleFromBlock({ block_id, role_id });
         })
       }
   
       // remove all instructions with role_id
       setState("script", "instructions", { ...arrayOfObjectsToObject(instructions_without_role) }); */
    // remove from roles
    let roles = { ...state.script.roles };
    delete roles[role_id];

    setState("script", {
      blocks: state.script.blocks,
      instructions: state.script.instructions,
      roles: { ...roles },
    });
  };

  this.setNameRole = ({ role_id, name }) => {
    if (name === "") return;
    setState("script", "roles", role_id, "name", name);
  };

  /*      let role_id = getRoleLength() + 1;
               setState("script", "roles", role_id, getDefaultRole()); */

  this.setDescriptionRole = ({ role_id, description }) => {
    setState("script", "roles", role_id, "description", description);
  };
  this.setAmount = (amount) => {
    console.error("roles.setAmount is not yet implemented");
    if (amount < Object.values(state.script.roles)) {
      // check if roles has instructions associated with it;
    }
  };
  // })();

  this.setDescriptionScript = (description) =>
    setState("script", "description", description);

  this.getEndBlockId = async ({ block_id, role_id }) => getEndBlock({ block_id, role_id })
  this.traverseRole = async ({ block_id, role_id }) => traverseRole({ block_id, role_id })

  this.controlRole = async (role_id) => {
    let result = await controlRole(role_id);
    console.log(actions);


    actions.setErrorsRoleId({
      role_id,
      errors: result.success ? [] : result.errors,
    })
  };


  const traverseRole = ({ role_id, block_id }) => new Promise((resolve, reject) => {

    if (!block_id) {
      console.error("ERROR: block_id is incorrect");
      return;
    }

    let traversed_block_ids = [];
    function iterateRole(block_id) {

      if (traversed_block_ids.indexOf(block_id) != -1) {
        resolve({
          success: false,
          traversed_block_ids,
          error: {
            type: 'infinite_loop',
            text: `found an infinite loop for role ${role_id}.`,
            block_ids: traversed_block_ids
          }
        });
        return;
      }
      traversed_block_ids.push(block_id);
      let next_block_id = state.script.blocks[block_id].roles[role_id].next_block_id;
      if (!next_block_id) {
        resolve({
          success: true,
          traversed_block_ids
        });
      } else {
        iterateRole(next_block_id)
      }
    }
    iterateRole(block_id);
  })

  const dedupArray = (array) => {
    let seen = {};
    let duplicates = {};
    array = array.filter(function (item) {
      if (seen.hasOwnProperty(item)) {
        duplicates[item] = true;
        return false;
      }
      seen[item] = true
      return true;
    });

    return [array, Object.keys(duplicates)]
  }

  // METHODS

  const controlRole = async (role_id) => {
    let start = performance.now();
    let instruction_ids = [];
    let errors = [];
    // get blocks per role
    let blocks = Object.entries(state.script.blocks).filter(
      ([block_id, block]) => {
        return Object.keys(block.roles).indexOf(role_id) !== -1
      });
    let block_ids = blocks.map(([block_id, block]) => block_id);


    // test #1 check for multiple open start/end-blocks for role
    let start_block_ids = blocks.filter(([block_id, block]) => {
      return !("prev_block_id" in block.roles[role_id])
    }
    ).map(([block_id, block]) => block_id);

    let end_block_ids = blocks.filter(([block_id, block]) => {
      return !("next_block_id" in block.roles[role_id])
    }).map(([block_id, block]) => block_id);

    let start_end_block_ids = [...start_block_ids, ...end_block_ids];
    [start_end_block_ids] = dedupArray(start_end_block_ids);

    if (start_block_ids.length > 1 || end_block_ids.length > 1) {
      errors.push({
        type: 'multiple_open_start_ports',
        text: `more then 2 possible starts for role ${role_id}`,
        block_ids: start_end_block_ids
      })
    }

    // test #2 look for infinite-loops by recursively iterating
    // through the start_blocks

    let promises = [];
    promises = start_block_ids.map((block_id) => this.traverseRole({ role_id, block_id }))
    let results = await Promise.all(promises);

    results.forEach(result => { if (!result.success) errors.push(result.error) })

    let total_traversed_block_ids = [].concat.apply([], results.map(result => result.traversed_block_ids));

    if (total_traversed_block_ids.length != block_ids.length) {
      // this can indicate
      //      a. that there are infinite_loops which are not accessible from start/end-blocks
      //      b. that there are block_ids which are connected to multiple start/end-blocks

      let [deduped_block_ids, duplicate_block_ids] = dedupArray(total_traversed_block_ids);

      if (deduped_block_ids.length !== total_traversed_block_ids.length) {
        console.error("block_ids were accessed via multiple start/end-blocks, most likely indicating a bug in the editor");
        errors.push({
          type: 'multiple_traversed_block_ids',
          text: `blocks were accessed multiple times for role ${role_id}, most likely indicating a bug in the editor`,
          block_ids: duplicate_block_ids
        })
      }
      total_traversed_block_ids = deduped_block_ids;

      let unaccessible_block_ids = block_ids.filter(block_id =>
        total_traversed_block_ids.indexOf(block_id) === -1
      )

      if (unaccessible_block_ids.length > 0) {
        const traverseAllUnaccessibleBlocks = () => new Promise((resolve) => {
          let results = [];
          let traverseRoleFromUnaccessibleBlockId = async (block_id) => {
            let result = await this.traverseRole({ role_id, block_id })
            results.push(result);
            /* if (!result.succes) {
                errors.push(result.error);
            } */
            unaccessible_block_ids = unaccessible_block_ids.filter(block_id =>
              result.traversed_block_ids.indexOf(block_id) === -1
            );
            if (unaccessible_block_ids.length === 0) {
              resolve(results);
            } else {
              traverseRoleFromUnaccessibleBlockId(unaccessible_block_ids[0])
            }
          }
          traverseRoleFromUnaccessibleBlockId(unaccessible_block_ids[0])
        })

        let results = await traverseAllUnaccessibleBlocks();
        results.forEach(result => {
          if (!result.success) {
            errors.push(result.error)
          }
          else {
            console.error("ERROR: unaccessible blocks should not be able to traverse successfully");
          }
        })
      }
    }

    console.info("control of role took: ", performance.now() - start, "ms");
    console.info("total errors of role", role_id, "after control ", errors);
    return errors.length == 0 ?
      {
        success: true,
        block_ids: total_traversed_block_ids
      } :
      {
        success: false,
        errors
      }
  }
  const controlRoles = async () => {
    let roles = state.script["roles"];
    let results = {};
    for (let role_id of Object.keys(roles)) {
      results[role_id] = await controlRole(role_id)
    }
    return results;
  }

  const getEndBlock = async ({ block_id, role_id }) => {
    let { traversed_block_ids } = await this.traverseRole({ block_id, role_id });
    return traversed_block_ids[traversed_block_ids.length - 1]
  }

  const processInstructions = () => {
    const getNextRoleIdsOfLast = (block) => {
      let next_role_ids = [];
      Object.values(block.roles).forEach((role) => {
        if (!role.next_block_id) return
        let connected_block = state.script.blocks[role.next_block_id];
        let next_instruction_id = connected_block.instructions[0];
        if (next_role_ids.indexOf(instructions[next_instruction_id].role_id) !== -1) return;
        next_role_ids.push(instructions[next_instruction_id].role_id);
      })
      return next_role_ids;
    }
    const getPrevInstructionIdsOfFirst = (block) => {
      let prev_instruction_ids = [];
      Object.values(block.roles).forEach((role) => {
        if (!role.prev_block_id) return;
        let connected_block = state.script.blocks[role.prev_block_id];
        let prev_instruction_id = connected_block.instructions[connected_block.instructions.length - 1];
        if (prev_instruction_ids.indexOf(instructions[prev_instruction_id].role_id) !== -1) return;
        prev_instruction_ids.push(prev_instruction_id);
      })
      return prev_instruction_ids
    }
    const getNextRoleIds = ({ block, count }) => [instructions[block.instructions[count + 1]].role_id]
    const getPrevInstructionIds = ({ block, count }) => [String(block.instructions[count - 1])]

    let instructions = { ...state.script.instructions };

    for (let block_id in state.script.blocks) {
      let block = state.script.blocks[block_id];
      let count = 0;
      for (let instruction_id of block.instructions) {
        instructions[instruction_id] = { ...instructions[instruction_id] };
        instructions[instruction_id].prev_instruction_ids = [];
        instructions[instruction_id].next_role_ids = [];

        console.log("count instruction: ", count, block.instructions.length - 1);

        // if instruction is the first
        if (count === 0) {
          instructions[instruction_id].prev_instruction_ids =
            getPrevInstructionIdsOfFirst(block);

          if (1 !== block.instructions.length) {
            instructions[instruction_id].next_role_ids =
              getNextRoleIds({ block, count });
          }
        }
        // if instruction is the last
        if (count === block.instructions.length - 1) {
          console.log("last block", block);
          instructions[instruction_id].next_role_ids =
            getNextRoleIdsOfLast(block);

          if (1 !== block.instructions.length) {
            instructions[instruction_id].prev_instruction_ids =
              getPrevInstructionIds({ block, count });
          }
        }
        // in all other occasions
        if (count !== 0 && count !== block.instructions.length - 1) {
          instructions[instruction_id].next_role_ids = getNextRoleIds({ block, count });
          instructions[instruction_id].prev_instruction_ids = getPrevInstructionIds({ block, count });
        }
        count++
      }
    }
    return instructions
  }



  this.processScript = async () => {
    let results = await controlRoles();
    if (Object.values(results).find(result => !result.success)) return { success: false };
    let roles = { ...state.script["roles"] };

    Object.entries(roles).forEach(([role_id, role]) => {
      roles[role_id] = { ...role };

      let instruction_ids = [];
      roles[role_id].instruction_ids = [];
      results[role_id].block_ids.forEach(block_id =>
        state.script.blocks[block_id].instructions.forEach(instruction_id => {

          if (!state.script.instructions[instruction_id]) {
            console.error('instruction ', instruction_id, 'does not exist');
            return;
          }
          if (state.script.instructions[instruction_id].role_id === role_id) {
            instruction_ids.push(instruction_id);
          }
        })
      )
      roles[role_id].instruction_ids = instruction_ids;
    })

    let instructions = processInstructions();

    return {
      success: true,
      roles,
      instructions
    }
  }

  this.processVideo = (file, instruction_id) => new Promise(async (resolve) => {
    const uploader = new Uploader();
    setState("editor", "uploaders", (uploaders) => [...uploaders, uploader]);
    let result = await uploader.process(`${urls.fetch}/api/uploadVideo/${state.script.script_id}/mp4`,
      { file, instruction_id });
    resolve(result);
  })
};

