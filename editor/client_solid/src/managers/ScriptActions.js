import uniqid from "uniqid";
import { array_insert, array_remove_element } from "../helpers/Pure";

import getRandomHue from "../helpers/getRandomHue";
import arrayOfObjectsToObject from "../helpers/arrayOfObjectsToObject";

import Uploader from "../helpers/Uploader";
import urls from "../urls";

import prevOrNext from "../helpers/prevOrNext";
import reverseDirection from "../helpers/reverseDirection";

export default function ScriptActions({
  state,
  setState,
  actions
}) {
  // default 

  const getDefaultInstruction = (role_id) => {
    return {
      script_id: state.script.script_id,
      role_id: role_id,
      type: "do",
      text: "",
    };
  };

  const getDefaultNode = () => {
    return {
      type: null,
      in_outs: {},
      position: {},
      parent_id: state.editor.parent_ids[state.editor.parent_ids.length - 1]
    };
  };

  const getDefaultGroup = () => {
    return {
      description: "",
      in_outs: {},
      parent_id: state.editor.parent_ids[state.editor.parent_ids.length - 1]
    };
  };
  // let scriptManager = this;
  this.setInstructions = (instructions) =>
    setState("script", "instructions", instructions);
  this.setRoles = (roles) => setState("script", "roles", roles);
  this.setGroups = (groups) => setState("script", "groups", groups);
  this.setNodes = (nodes) => setState("script", "nodes", nodes);
  this.setScriptId = (script_id) => setState("script", "script_id", script_id);
  this.setParentIds = (parent_ids) => setState("editor", "parent_ids", parent_ids);

  //


  //// INSTRUCTIONS


  this.addInstruction = (role_id) => {
    let instruction = getDefaultInstruction(role_id);
    let instruction_id = uniqid();
    setState("script", "instructions", instruction_id, instruction);
    return { instruction, instruction_id };
  };

  this.removeInstruction = (instruction_id) => {
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

  /*   const updateNode = (node_id, data) => {
      let node = state.script.nodes[node_id];
      if (!node) return;
  
      Object.keys(data).forEach((key) => {
        setState("script", "nodes", node_id, key, data[key]);
      });
    }; */

  // INTERNAL FUNCTIONS


  const offsetConnections = ({ node_ids, offset }) => {
    let _connections = connections.map((_connection) => {
      let _pos = [..._connection.pos];
      if (node_ids.includes(_connection.in_node_id)) {
        if (!_pos[0]) {
          console.error(
            "_connection.in_node_id",
            _connection.in_node_id,
            connections
          );
        } else {
          _pos[0].x += offset.x;
          _pos[0].y += offset.y;
        }
      }
      if (node_ids.includes(_connection.out_node_id)) {
        if (!_pos[1]) {
          console.error(
            "_connection.out_node_id",
            _connection.out_node_id,
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

  const removeNode = (node_id) => {
    let node = state.script.nodes[node_id];

    if (node.instructions) {
      // remove all instructions that are a part of node
      node.instructions.forEach((instruction_id) => {
        // delete instructions[instruction_id];
        setState("script", "instructions", instruction_id, undefined);
      });
    }


    let roles = { ...node.in_outs };
    let role_ids = Object.keys(roles);

    // remove reference to node in connected nodes
    Object.entries(roles).forEach(([role_id, role]) => {
      if (role.out_node_id != undefined) {
        setConnection({
          node_id: role.out_node_id,
          connecting_node_id: undefined,
          role_id,
          direction: "in",
        });
      }
      if (role.in_node_id != undefined) {
        setConnection({
          node_id: role.in_node_id,
          connecting_node_id: undefined,
          role_id,
          direction: "out",
        });
      }
    });

    setState("script", "nodes", node_id, undefined);
    return { role_ids };
  };

  const setConnection = ({
    node_id,
    connecting_node_id,
    role_id,
    direction,
  }) => {
    setState("script",
      "nodes",
      node_id,
      "roles",
      role_id,
      prevOrNext(direction),
      connecting_node_id
    );
  };

  // METHODS

  this.addNode = () => {
    let node = getDefaultNode();
    const node_id = uniqid();
    node.type = 'instruction';
    node.instructions = [];
    node.position = {
      x:
        (state.editor.navigation.cursor.x - state.editor.navigation.origin.x) / state.editor.navigation.zoom - 450,
      y: (state.editor.navigation.cursor.y - state.editor.navigation.origin.y) / state.editor.navigation.zoom,
    };
    setState("script", "nodes", node_id, node);
    return node_id;
  };

  this.removeSelectedNodes = () => {
    // console.error("removeSelectedNodes is not yet implemented");
    let all_affected_role_ids = [];
    state.editor.selection.forEach((node_id) => {
      let { role_ids } = removeNode(node_id);

      role_ids.forEach((role_id) => {
        if (all_affected_role_ids.indexOf(role_id) !== -1) return;
        all_affected_role_ids = [...all_affected_role_ids, ...role_id];
      });

    });
    return { role_ids: all_affected_role_ids };
  };

  this.addRoleToNode = ({ node_id, role_id }) => {
    if (Object.keys(state.script.nodes[node_id].in_outs).length === 0) {
      let { instruction_id } = this.addInstruction(role_id);
      this.addInstructionId({ node_id, instruction_id });
    }

    setState("script", "nodes", node_id, "in_outs", role_id, {
      role_id,
      node_id,
    });
    this.controlRole(role_id);
  };

  this.removeRoleFromNode = ({ node_id, role_id }) => {
    let instruction_ids = state.script.nodes[node_id].instructions.filter(
      (instruction_id) =>
        state.script.instructions[instruction_id].role_id === role_id
    );

    // remove node_id from the roles' connected nodes
    let roles = state.script.nodes[node_id].in_outs;
    let role = roles[role_id];

    if (Object.keys(roles).length > 1) {
      // null out_node_id from connected prev_node
      if (role.in_node_id) {
        this.removeConnectionBothWays({
          node_id,
          role_id,
          direction: "in",
        });
      }

      // null in_node_id from connected next_node
      if (role.out_node_id) {
        this.removeConnectionBothWays({
          node_id,
          role_id,
          direction: "out",
        });
      }
      // remove all instructions from node with role_id
      setState("script",
        "nodes",
        node_id,
        "instructions",
        state.script.nodes[node_id].instructions.filter(
          (instruction_id) =>
            state.script.instructions[instruction_id].role_id !== role_id
        )
      );

      // remove role_id from roles
      setState("script", "nodes", node_id, "roles", role_id, undefined);
    } else {
      // remove node completely
      removeNode(node_id);
    }

    // remove from state.script.instructions
    instruction_ids.forEach((instruction_id) => {
      setState("script", "instructions", instruction_id, undefined);
    });
  };

  this.convertRole = ({ node_id, source_role_id, target_role_id }) => {
    state.script.nodes[node_id].instructions.forEach((instruction_id) => {
      if (state.script.instructions[instruction_id].role_id !== source_role_id)
        return;
      setState("script", "instructions", instruction_id, "role_id", target_role_id);
    });

    this.removeRoleFromNode({ node_id, role_id: source_role_id });
  };

  this.addInstructionId = ({ node_id, instruction_id, index = false }) => {

    console.log(state.script.nodes[node_id], state.script.nodes, node_id);


    let instruction_ids = [...state.script.nodes[node_id].instructions];
    if (index) {
      setState("script",
        "nodes",
        node_id,
        "instructions",
        array_insert(instruction_ids, index, instruction_id)
      );
    } else {
      setState("script", "nodes", node_id, "instructions", [
        ...instruction_ids,
        instruction_id,
      ]);
    }
  };

  this.removeInstructionId = ({ node_id, instruction_id, index }) => {
    setState("script",
      "nodes",
      node_id,
      "instructions",
      array_remove_element(
        state.script.nodes[node_id].instructions,
        instruction_id
      )
    );
  };

  this.translateSelectedNodes = ({ offset }) => {
    state.editor.selection.forEach((node_id) => {
      setState("script", "nodes", node_id, "position", (position) => {
        return ({
          x: position.x + offset.x / state.editor.navigation.zoom,
          y: position.y + offset.y / state.editor.navigation.zoom,
        })
      });
    });
  };

  this.addConnection = ({
    node_id,
    connecting_node_id,
    role_id,
    direction,
  }) => {
    // check if connecting_node_id.in_outs[role_id][opposite_direction] is already connected to a node_id
    // if yes: remove reference to connecting_node_id from connecting_node_id.in_outs[role_id][opposite_direction]
    const opposite_direction = reverseDirection(direction);

    let node_id_initially_connected_to_connecting_node =
      state.script.nodes[connecting_node_id].in_outs[role_id] &&
      state.script.nodes[connecting_node_id].in_outs[role_id][prevOrNext(opposite_direction)];

    if (node_id_initially_connected_to_connecting_node) {
      // dereference connecting_node at node initially connected to connecting_node
      setConnection({
        node_id: node_id_initially_connected_to_connecting_node,
        connecting_node_id: undefined,
        role_id,
        direction,
      });
    }
    // make reference to connecting_node_id at this node.in_outs[role_id]
    setConnection({
      node_id,
      connecting_node_id,
      role_id,
      direction,
    });
    // make reference to node_id at connecting_node_id.in_outs[role_id]
    setConnection({
      node_id: connecting_node_id,
      connecting_node_id: node_id,
      role_id,
      direction: opposite_direction,
    });
  };

  this.removeConnectionBothWays = ({ node_id, role_id, direction }) => {
    let connecting_node_id =
      state.script.nodes[node_id].in_outs[role_id][prevOrNext(direction)];

    if (connecting_node_id) {
      // dereference this node_id at initial_connecting_node.in_outs[role_id][opposite_direciton]
      setConnection({
        node_id: connecting_node_id,
        connecting_node_id: undefined,
        role_id,
        direction: reverseDirection(direction),
      });
    }
    // dereference node.in_outs[role_id][direction]
    setConnection({
      node_id,
      connecting_node_id: undefined,
      role_id,
      direction,
    });
  };

  this.hasRoleId = ({ node_id, role_id }) => {
    console.log(state.script.nodes, node_id);
    return role_id in state.script.nodes[node_id].in_outs;
  }

  ////

  this.instructions = new (function () { })();

  this.nodes = new (function () { })();

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
    Object.entries(state.script.nodes).forEach(([node_id, node]) => {
      if (Object.keys(node.in_outs).indexOf(role_id) == -1) return;
      this.removeRoleFromNode({ node_id, role_id });
    });

    // check if role has any instructions associated with it

    /*  let instructions_without_role = Object.entries(state.script.instructions).filter(
         ([instruction_id, instruction]) => instruction.role_id != role_id
       );
   
       if (instructions_without_role.length < Object.keys(state.script.instructions).length) {
         // remove instructions + references to role from nodes
         Object.entries(state.script.nodes).forEach(([node_id, node]) => {
           if (Object.keys(node.in_outs).indexOf(role_id) == -1) return;
           scriptManager.nodes.removeRoleFromNode({ node_id, role_id });
         })
       }
   
       // remove all instructions with role_id
       setState("script", "instructions", { ...arrayOfObjectsToObject(instructions_without_role) }); */
    // remove from roles
    let roles = { ...state.script.roles };
    delete roles[role_id];

    setState("script", {
      nodes: state.script.nodes,
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

  this.getEndNodeId = async ({ node_id, role_id }) => getEndNode({ node_id, role_id })
  this.traverseRole = ({ role_id, node_id }) => new Promise((resolve, reject) => {
    if (!node_id) {
      console.error("ERROR: node_id is incorrect");
      return;
    }
    let traversed_node_ids = [];
    function iterateRole(node_id) {
      if (traversed_node_ids.indexOf(node_id) != -1) {
        resolve({
          success: false,
          traversed_node_ids,
          error: {
            type: 'infinite_loop',
            text: `found an infinite loop for role ${role_id}.`,
            node_ids: traversed_node_ids
          }
        });
        return;
      }
      traversed_node_ids.push(node_id);
      let out_node_id = state.script.nodes[node_id].in_outs[role_id].out_node_id;
      if (!out_node_id) {
        resolve({
          success: true,
          traversed_node_ids
        });
      } else {
        iterateRole(out_node_id)
      }
    }
    iterateRole(node_id);
  })

  this.controlRole = async (role_id) => {
    let result = await controlRole(role_id);


    actions.setErrorsRoleId({
      role_id,
      errors: result.success ? [] : result.errors,
    })
  };


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
    // get nodes per role
    let nodes = Object.entries(state.script.nodes).filter(
      ([node_id, node]) => {
        return Object.keys(node.in_outs).indexOf(role_id) !== -1
      });
    let node_ids = nodes.map(([node_id, node]) => node_id);


    // test #1 check for multiple open start/end-nodes for role
    let start_node_ids = nodes.filter(([node_id, node]) => {

      return !node.in_outs[role_id].in_node_id
    }
    ).map(([node_id, node]) => node_id);

    let end_node_ids = nodes.filter(([node_id, node]) => {
      return !("out_node_id" in node.in_outs[role_id])
    }).map(([node_id, node]) => node_id);

    let start_end_node_ids = [...start_node_ids, ...end_node_ids];
    [start_end_node_ids] = dedupArray(start_end_node_ids);

    if (start_node_ids.length > 1 || end_node_ids.length > 1) {
      errors.push({
        type: 'multiple_open_start_ports',
        text: `more then 2 possible starts for role ${role_id}`,
        node_ids: start_end_node_ids
      })
    }

    // test #2 look for infinite-loops by recursively iterating
    // through the start_nodes

    let promises = [];

    promises = start_node_ids.map((node_id) => this.traverseRole({ role_id, node_id }))
    let results = await Promise.all(promises);



    results.forEach(result => { if (!result.success) errors.push(result.error) })

    let total_traversed_node_ids = [].concat.apply([], results.map(result => result.traversed_node_ids));

    if (total_traversed_node_ids.length != node_ids.length) {
      // this can indicate
      //      a. that there are infinite_loops which are not accessible from start/end-nodes
      //      b. that there are node_ids which are connected to multiple start/end-nodes

      let [deduped_node_ids, duplicate_node_ids] = dedupArray(total_traversed_node_ids);

      if (deduped_node_ids.length !== total_traversed_node_ids.length) {
        console.error("node_ids were accessed via multiple start/end-nodes, most likely indicating a bug in the editor");
        errors.push({
          type: 'multiple_traversed_node_ids',
          text: `nodes were accessed multiple times for role ${role_id}, most likely indicating a bug in the editor`,
          node_ids: duplicate_node_ids
        })
      }


      total_traversed_node_ids = deduped_node_ids;

      let unaccessible_node_ids = node_ids.filter(node_id =>
        total_traversed_node_ids.indexOf(node_id) === -1
      )



      if (unaccessible_node_ids.length > 0) {
        console.error("unaccessible_node_ids is not [] :", unaccessible_node_ids);
        const traverseAllUnaccessibleNodes = () => new Promise((resolve) => {
          let results = [];
          let traverseRoleFromUnaccessibleNodeId = async (node_id) => {
            let result = await this.traverseRole({ role_id, node_id })
            results.push(result);
            /* if (!result.succes) {
                errors.push(result.error);
            } */
            unaccessible_node_ids = unaccessible_node_ids.filter(node_id =>
              result.traversed_node_ids.indexOf(node_id) === -1
            );
            if (unaccessible_node_ids.length === 0) {
              resolve(results);
            } else {
              traverseRoleFromUnaccessibleNodeId(unaccessible_node_ids[0])
            }
          }
          traverseRoleFromUnaccessibleNodeId(unaccessible_node_ids[0])
        })

        let results = await traverseAllUnaccessibleNodes();
        results.forEach(result => {
          if (!result.success) {
            errors.push(result.error)
          }
          else {
            console.error("ERROR: unaccessible nodes should not be able to traverse successfully", role_id, result);
          }
        })
      }
    }

    console.info("control of role took: ", performance.now() - start, "ms");
    console.info("total errors of role", role_id, "after control ", errors);
    return errors.length == 0 ?
      {
        success: true,
        node_ids: total_traversed_node_ids
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

  const getEndNode = async ({ node_id, role_id }) => {
    let { traversed_node_ids } = await this.traverseRole({ node_id, role_id });
    return traversed_node_ids[traversed_node_ids.length - 1]
  }

  const processInstructions = () => {
    const getNextRoleIdsOfLast = (node) => {
      let next_role_ids = [];
      Object.values(node.in_outs).forEach((role) => {
        if (!role.out_node_id) return
        let connected_node = state.script.nodes[role.out_node_id];
        let next_instruction_id = connected_node.instructions[0];
        if (!instructions[next_instruction_id]) {
          console.error('next_instruction_id', next_instruction_id, 'does not exist!');
          return;
        }
        if (next_role_ids.indexOf(instructions[next_instruction_id].role_id) !== -1) return;
        next_role_ids.push(instructions[next_instruction_id].role_id);
      })
      return next_role_ids;
    }
    const getPrevInstructionIdsOfFirst = (node) => {
      let prev_instruction_ids = [];
      Object.values(node.in_outs).forEach((role) => {
        if (!role.in_node_id) return;
        let connected_node = state.script.nodes[role.in_node_id];
        let prev_instruction_id = connected_node.instructions[connected_node.instructions.length - 1];

        if (!instructions[prev_instruction_id]) {
          console.error('prev_instruction_id', prev_instruction_id, 'does not exist!');
          return;
        }



        if (instructions[prev_instruction_id] && prev_instruction_ids.indexOf(instructions[prev_instruction_id].role_id) !== -1) return;
        prev_instruction_ids.push(prev_instruction_id);
      })
      return prev_instruction_ids
    }
    const getNextRoleIds = ({ node, count }) => [instructions[node.instructions[count + 1]].role_id]
    const getPrevInstructionIds = ({ node, count }) => [String(node.instructions[count - 1])]

    let instructions = { ...state.script.instructions };

    for (let node_id in state.script.nodes) {
      let node = state.script.nodes[node_id];
      let count = 0;
      for (let instruction_id of node.instructions) {
        instructions[instruction_id] = { ...instructions[instruction_id] };
        instructions[instruction_id].prev_instruction_ids = [];
        instructions[instruction_id].next_role_ids = [];



        // if instruction is the first
        if (count === 0) {
          instructions[instruction_id].prev_instruction_ids =
            getPrevInstructionIdsOfFirst(node);

          if (1 !== node.instructions.length) {
            instructions[instruction_id].next_role_ids =
              getNextRoleIds({ node, count });
          }
        }
        // if instruction is the last
        if (count === node.instructions.length - 1) {

          instructions[instruction_id].next_role_ids =
            getNextRoleIdsOfLast(node);

          if (1 !== node.instructions.length) {
            instructions[instruction_id].prev_instruction_ids =
              getPrevInstructionIds({ node, count });
          }
        }
        // in all other occasions
        if (count !== 0 && count !== node.instructions.length - 1) {
          instructions[instruction_id].next_role_ids = getNextRoleIds({ node, count });
          instructions[instruction_id].prev_instruction_ids = getPrevInstructionIds({ node, count });
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
      results[role_id].node_ids.forEach(node_id =>
        state.script.nodes[node_id].instructions.forEach(instruction_id => {

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



  this.groupSelectedNodes = () => {
    const selection = [...state.editor.selection];

    let group = getDefaultGroup();
    // group.children = { ...state.editor.selection };
    let group_id = uniqid();
    let node = getDefaultNode();

    node.type = "group";
    node.parent_id = group_id;
    node.position = {
      x: state.editor.navigation.cursor.x - 450,
      y: state.editor.navigation.cursor.y
    };

    selection.forEach(node_id => {
      Object.keys(state.script.nodes[node_id].in_outs).forEach((role_id) => {
        group.in_outs[role_id] = {
          in_node_id: null,
          out_node_id: null
        }
        node.in_outs[role_id] = {
          in_node_id: null,
          out_node_id: null
        }
      }
      )
    });

    // Object.keys(group.in_outs).forEach(role_id => )

    setState("script", "groups", group_id, group);
    setState("script", "nodes", uniqid(), node);

    selection.forEach((node_id) => {
      setState("script", "nodes", node_id, "parent_id", group_id)
    })
  }
};

