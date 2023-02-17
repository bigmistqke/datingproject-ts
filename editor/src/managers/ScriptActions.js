import uniqid from "uniqid";
import { array_insert, array_remove_element } from "../helpers/Pure";

import getRandomHue from "../helpers/getRandomHue";
import arrayOfObjectsToObject from "../helpers/arrayOfObjectsToObject";

import Uploader from "../helpers/Uploader";
import urls from "../urls";

import prevOrNext from "../helpers/prevOrNext";
import reverseDirection from "../helpers/reverseDirection";
import clone from "../helpers/clone";
import { batch } from "solid-js";
import postData from "../helpers/postData";
import getData from "../helpers/getData";

export default function ScriptActions({ state, setState, actions }) {
  // default

  const getDefaultInstruction = (role_id) => {
    return {
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
      parent_id: state.editor.parent_ids[state.editor.parent_ids.length - 1],
    };
  };

  const getDefaultGroup = () => {
    return {
      description: "",
      in_outs: {},
      parent_id: state.editor.parent_ids[state.editor.parent_ids.length - 1],
    };
  };
  this.setInstructions = (instructions) =>
    setState("script", "instructions", instructions);
  this.setRoles = (roles) => setState("script", "roles", roles);
  this.setGroups = (groups) => setState("script", "groups", groups);
  this.setNodes = (nodes) => setState("script", "nodes", nodes);
  this.setScriptId = (script_id) => setState("script", "script_id", script_id);
  this.setDesignId = (design_id) => setState("script", "design_id", design_id);

  this.setParentIds = (parent_ids) =>
    setState("editor", "parent_ids", parent_ids);

  //

  this.iterateNodes = (nodes) => {

    const start = new Date().getTime();
    batch(() => {
      for (let i = 0; i < 50; i++) {

        let [node_id, node] = nodes.shift();
        setState("script", "nodes", node_id, node);
        if (nodes.length === 0) {
          break
        }
      }
    })
    if (nodes.length === 0) return
    setTimeout(() => this.iterateNodes(nodes), 0);
  }

  //// INSTRUCTIONS

  this.addInstruction = ({ role_id, instruction, instruction_id }) => {
    if (!instruction) instruction = getDefaultInstruction(role_id);
    if (!instruction_id) instruction_id = uniqid();
    setState("script", "instructions", instruction_id, instruction);
    return { instruction, instruction_id };
  };

  this.removeInstruction = ({ instruction_id, node_id }) => {
    setState("script", "nodes", node_id, "instructions", (instructions) =>
      instructions.filter((i) => i !== instruction_id)
    );

    let instructions = { ...state.script.instructions };
    instructions[instruction_id] = undefined;
    setState("script", "instructions", instructions);
  };

  this.setInstruction = (instruction_id, data) => {
    for (let key in data) {
      setState("script", "instructions", instruction_id, key, data[key]);
    }
  };

  this.setFilesize = ({ instruction_id, filesize }) =>
    setState("script", "instructions", instruction_id, "filesize", filesize);


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

  this.setNodeDimensions = ({ node_id, width, height }) => {
    setState("script", "nodes", node_id, "dimensions", { width, height })
  }


  let observer = new IntersectionObserver((entries, observer) => {
    batch(() => {
      entries.forEach(entry => {
        let node_id = entry.target.id.split("_")[1];
        setState("script", "nodes", node_id, "visible", entry.isIntersecting)
      })
    })

  }, {
    rootMargin: '50px'
  });

  this.observe = ({ dom }) => observer.observe(dom)
  this.unobserve = ({ dom }) => observer.unobserve(dom)


  const removeNode = (node_id) => {
    let role_ids;
    batch(() => {
      let node = state.script.nodes[node_id];

      if (node.instructions) {
        // remove all instructions that are a part of node
        node.instructions.forEach((instruction_id) => {
          // delete instructions[instruction_id];
          setState("script", "instructions", instruction_id, undefined);
        });
      }

      let roles = { ...node.in_outs };
      role_ids = Object.keys(roles);

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
      setState("editor", "selection", (selection) =>
        selection.filter((id) => id !== node_id)
      );

      setState("script", "nodes", node_id, undefined);
    });

    return { role_ids };
  };

  const setConnection = ({
    node_id,
    connecting_node_id,
    role_id,
    direction,
  }) => {
    console.info("set connection!!!", state.script.nodes, node_id);
    setState(
      "script",
      "nodes",
      node_id,
      "in_outs",
      role_id,
      prevOrNext(direction),
      connecting_node_id
    );
  };

  // METHODS

  this.addNode = (pars) => {
    const position = pars?.position ?? {
      x:
        (state.editor.navigation.cursor.x - state.editor.navigation.origin.x) /
        state.editor.navigation.zoom -
        450,
      y:
        (state.editor.navigation.cursor.y - state.editor.navigation.origin.y) /
        state.editor.navigation.zoom,
    }
    const type = pars?.type ?? "instruction";

    const node = getDefaultNode();
    const node_id = uniqid();
    node.type = type;
    node.instructions = [];
    node.position = position;

    setState("script", "nodes", node_id, node);

    return node_id;
  };



  this.removeSelectedNodes = () => {
    let all_role_ids = new Set();
    batch(() => {
      state.editor.selection.forEach((node_id) => {
        let { role_ids } = removeNode(node_id);
        role_ids.forEach(all_role_ids.add, all_role_ids);
      });
    });
    all_role_ids.forEach((role_id) => this.controlRole(role_id))
    return { role_ids: all_role_ids };
  };

  this.duplicateSelectedNodes = () => {

    batch(() => {
      // console.error("removeSelectedNodes is not yet implemented");
      // let all_affected_role_ids = [];
      //

      let node_map = {};

      state.editor.selection.forEach(
        (node_id) => (node_map[node_id] = uniqid())
      );

      Object.entries(node_map).forEach(([node_id, new_node_id]) => {
        const new_node = clone(state.script.nodes[node_id]);
        new_node.position.x += 600;
        new_node.instructions = new_node.instructions.map((instruction_id) => {
          const id = uniqid();
          setState("script", "instructions", id, {
            ...state.script.instructions[instruction_id],
          });
          return id;
        });
        setState("script", "nodes", new_node_id, new_node);
      });


      Object.values(node_map).forEach((new_node_id) => {
        Object.entries(state.script.nodes[new_node_id].in_outs).forEach(
          ([role_id, in_out]) => {
            if (in_out.out_node_id) {
              if (state.editor.selection.indexOf(in_out.out_node_id) === -1) {
                setState(
                  "script",
                  "nodes",
                  new_node_id,
                  "in_outs",
                  role_id,
                  "out_node_id",
                  undefined
                );
              } else {
                setState(
                  "script",
                  "nodes",
                  new_node_id,
                  "in_outs",
                  role_id,
                  "out_node_id",
                  node_map[in_out.out_node_id]
                );
              }
            }
            if (in_out.in_node_id) {
              if (state.editor.selection.indexOf(in_out.in_node_id) === -1) {
                setState(
                  "script",
                  "nodes",
                  new_node_id,
                  "in_outs",
                  role_id,
                  "in_node_id",
                  undefined
                );
              } else {
                setState(
                  "script",
                  "nodes",
                  new_node_id,
                  "in_outs",
                  role_id,
                  "in_node_id",
                  node_map[in_out.in_node_id]
                );
              }
            }
            return [role_id, in_out];
          }
        );
      });


      actions.removeFromSelection(Object.keys(node_map));
      actions.addToSelection(Object.values(node_map));
    });
    controlRoles();
  };

  this.addRoleToNode = ({ node_id, role_id }) => {
    const node = state.script.nodes[node_id];

    if (node.type === 'instruction' && Object.keys(node.in_outs).length === 0) {
      let { instruction_id } = this.addInstruction({ role_id });
      this.addInstructionIdToNode({ node_id, instruction_id });
    }

    const role = state.script.roles[role_id];

    setState("script", "nodes", node_id, "in_outs", role_id, {
      // role_id,
      // node_id,
      hidden: role.hidden
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
      setState(
        "script",
        "nodes",
        node_id,
        "instructions",
        state.script.nodes[node_id].instructions.filter(
          (instruction_id) =>
            state.script.instructions[instruction_id].role_id !== role_id
        )
      );

      // remove role_id from roles
      setState("script", "nodes", node_id, "in_outs", role_id, undefined);
    } else {
      // remove node completely
      removeNode(node_id);
    }

    // remove from state.script.instructions
    instruction_ids.forEach((instruction_id) => {
      setState("script", "instructions", instruction_id, undefined);
    });

    setTimeout(() => {
      this.controlRole(role_id)
    }, 1000)

  };

  this.convertRole = ({ node_ids, source_role_id, target_role_id }) => {
    const reconnections = [];

    node_ids.forEach(node_id => {
      const node = state.script.nodes[node_id];
      if (!node.in_outs[source_role_id]) return
      if (!node.in_outs[target_role_id])
        this.addRoleToNode({
          node_id: node_id,
          role_id: target_role_id,
        })

      node.instructions
        .filter((instruction_id) =>
          state.script.instructions[instruction_id].role_id === source_role_id
        ).forEach((instruction_id) => {
          setState(
            "script",
            "instructions",
            instruction_id,
            "role_id",
            target_role_id
          );
        });

      const source_in_out = node.in_outs[source_role_id];
      if (source_in_out.in_node_id) {
        // check if 
        if (
          state.script.nodes[source_in_out.in_node_id].in_outs[target_role_id]
        ) {
          reconnections.push({
            node_id,
            connecting_node_id: source_in_out.in_node_id,
            role_id: target_role_id,
            direction: 'in'
          })
        }
      }
      if (source_in_out.out_node_id) {
        if (
          node_ids.indexOf(source_in_out.out_node_id) !== -1 ||
          state.script.nodes[source_in_out.out_node_id].in_outs[target_role_id]
        ) {
          reconnections.push({
            node_id,
            connecting_node_id: source_in_out.out_node_id,
            role_id: target_role_id,
            direction: 'out'
          })
        }
      }
    })

    node_ids.forEach(node_id => {
      const node = state.script.nodes[node_id];
      if (!node.in_outs[source_role_id]) return
      this.removeRoleFromNode({ node_id, role_id: source_role_id })
    })


    reconnections.forEach(reconnection => {
      this.addConnection(reconnection)
    })

    this.controlRole(source_role_id);
    this.controlRole(target_role_id);

  };

  this.addInstructionIdToNode = ({ node_id, instruction_id, index = false }) => {
    let instruction_ids = [...state.script.nodes[node_id].instructions];
    if (index) {
      setState(
        "script",
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

  /*   this.removeInstructionId = ({ node_id, instruction_id, index }) => {
      setState("script",
        "nodes",
        node_id,
        "instructions",
        array_remove_element(
          state.script.nodes[node_id].instructions,
          instruction_id
        )
      );
    }; */

  this.translateSelectedNodes = ({ offset }) => {
    state.editor.selection.forEach((node_id) => {
      setState("script", "nodes", node_id, "position", (position) => {
        return {
          x: position.x + offset.x / state.editor.navigation.zoom,
          y: position.y + offset.y / state.editor.navigation.zoom,
        };
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
      state.script.nodes[connecting_node_id].in_outs[role_id][
      prevOrNext(opposite_direction)
      ];

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
    return role_id in state.script.nodes[node_id].in_outs;
  };

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
  const getDefaultRole = (props) => {
    let name = props?.name ?? getInitialName();
    const hue = getRandomHue(+name ? name : 0).toString();
    return {
      instruction_ids: [],
      description: "",
      hue,
      name,
      ...props
    };
  };

  this.addRoleToScript = (props) => {
    console.log(uniqid(), getDefaultRole(props))
    setState("script", "roles", uniqid(), getDefaultRole(props));
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

  this.getEndNodeId = async ({ node_id, role_id }) =>
    getEndNode({ node_id, role_id });
  this.traverseRole = ({ role_id, node_id }) =>
    new Promise((resolve, reject) => {
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
              type: "infinite_loop",
              text: `found an infinite loop for role ${role_id}.`,
              node_ids: traversed_node_ids,
            },
          });
          return;
        }
        traversed_node_ids.push(node_id);
        let out_node_id =
          state.script.nodes[node_id].in_outs[role_id].out_node_id;
        if (!out_node_id) {
          resolve({
            success: true,
            traversed_node_ids,
          });
        } else {
          iterateRole(out_node_id);
        }
      }
      iterateRole(node_id);
    });

  this.controlRole = async (role_id) => {
    // let result = await controlRole(role_id);

    console.log("controlRole", role_id);

    let start = performance.now();
    let instruction_ids = [];
    let errors = [];
    // get nodes per role
    let nodes = Object.entries(state.script.nodes).filter(([node_id, node]) => {
      return Object.keys(node.in_outs).indexOf(role_id) !== -1;
    });
    let node_ids = nodes.map(([node_id, node]) => node_id);

    console.log(node_ids);

    // test #1 check for multiple open start/end-nodes for role
    let start_node_ids = nodes
      .filter(([node_id, node]) => !node.in_outs[role_id].in_node_id)
      .map(([node_id, node]) => node_id);

    let end_node_ids = nodes
      .filter(([node_id, node]) => {
        return !("out_node_id" in node.in_outs[role_id]);
      })
      .map(([node_id, node]) => node_id);

    let start_end_node_ids = [...start_node_ids, ...end_node_ids];
    [start_end_node_ids] = dedupArray(start_end_node_ids);

    if (start_node_ids.length > 1 || end_node_ids.length > 1) {
      errors.push({
        type: "multiple_open_start_ports",
        text: `more then 2 possible starts for role ${state.script.roles[role_id].name}`,
        node_ids: start_end_node_ids,
      });
    }

    // test #2 look for infinite-loops by recursively iterating
    // through the start_nodes

    let promises = [];

    let results = await Promise.all(
      start_node_ids.map((node_id) => this.traverseRole({ role_id, node_id }))
    );

    results.forEach((result) => {
      if (!result.success) errors.push(result.error);
    });

    let total_traversed_node_ids = [].concat.apply(
      [],
      results.map((result) => result.traversed_node_ids)
    );

    if (total_traversed_node_ids.length != node_ids.length) {
      // this can indicate
      //      a. that there are infinite_loops which are not accessible from start/end-nodes
      //      b. that there are node_ids which are connected to multiple start/end-nodes

      let [deduped_node_ids, duplicate_node_ids] = dedupArray(
        total_traversed_node_ids
      );

      if (deduped_node_ids.length > total_traversed_node_ids.length) {
        console.error(
          "node_ids were accessed via multiple start/end-nodes, most likely indicating a bug in the editor"
        );
        errors.push({
          type: "multiple_traversed_node_ids",
          text: `nodes were accessed multiple times for role ${state.script.roles[role_id].name
            }: ${duplicate_node_ids.join()} most likely indicating a bug in the editor`,
          node_ids: duplicate_node_ids,
        });
      }

      total_traversed_node_ids = deduped_node_ids;

      let unaccessible_node_ids = node_ids.filter(
        (node_id) => total_traversed_node_ids.indexOf(node_id) === -1
      );

      if (unaccessible_node_ids.length > 0) {
        console.error(
          "unaccessible_node_ids is not [] :",
          unaccessible_node_ids
        );
        const traverseAllUnaccessibleNodes = () =>
          new Promise((resolve) => {
            let results = [];
            let traverseRoleFromUnaccessibleNodeId = async (node_id) => {
              let result = await this.traverseRole({ role_id, node_id });
              results.push(result);
              /* if (!result.succes) {
                errors.push(result.error);
            } */
              unaccessible_node_ids = unaccessible_node_ids.filter(
                (node_id) => result.traversed_node_ids.indexOf(node_id) === -1
              );
              if (unaccessible_node_ids.length === 0) {
                resolve(results);
              } else {
                traverseRoleFromUnaccessibleNodeId(unaccessible_node_ids[0]);
              }
            };
            traverseRoleFromUnaccessibleNodeId(unaccessible_node_ids[0]);
          });

        let results = await traverseAllUnaccessibleNodes();
        results.forEach((result) => {
          if (!result.success) {
            errors.push(result.error);
          } else {
            console.error(
              "ERROR: unaccessible nodes should not be able to traverse successfully",
              role_id,
              result
            );
          }
        });
      }
    }

    // console.info("control of role took: ", performance.now() - start, "ms");
    // console.info("total errors of role", role_id, "after control ", errors);

    actions.setErrorsRoleId({
      role_id,
      errors,
    });

    return errors.length == 0
      ? {
        success: true,
        node_ids: total_traversed_node_ids,
      }
      : {
        success: false,
        errors,
      };
  };

  const dedupArray = (array) => {
    let seen = {};
    let duplicates = {};
    array = array.filter(function (item) {
      if (seen.hasOwnProperty(item)) {
        duplicates[item] = true;
        return false;
      }
      seen[item] = true;
      return true;
    });

    return [array, Object.keys(duplicates)];
  };

  // METHODS

  /*   const controlRole = async (role_id) => {
      
    } */
  const controlRoles = async () => {
    let roles = {};
    for (let role_id of Object.keys(state.script["roles"])) {
      roles[role_id] = await this.controlRole(role_id);
    }
    return roles;
  };

  const getEndNode = async ({ node_id, role_id }) => {
    let { traversed_node_ids } = await this.traverseRole({ node_id, role_id });
    return traversed_node_ids[traversed_node_ids.length - 1];
  };

  const getNextRoleIdsOfLast = (node) =>
    Object.values(node.in_outs)
      .filter((role) => role.out_node_id)
      .map((role) => {
        const connected_node = state.script.nodes[role.out_node_id];
        const next_instruction_id = connected_node.instructions[0];
        if (!next_instruction_id) {
          return undefined
        }
        return state.script.instructions[next_instruction_id].role_id;
      })
      .filter((value, index, self) => self.indexOf(value) === index);

  const getPrevInstructionIdsOfFirst = (node) =>
    Object.values(node.in_outs)
      .filter((role) => role.in_node_id)
      .map((role) => {
        const connected_node = state.script.nodes[role.in_node_id];
        return connected_node.instructions[
          connected_node.instructions.length - 1
        ];
      })
      .filter((value, index, self) => self.indexOf(value) === index);

  const getNextRoleIds = ({ node, index }) => [
    state.script.instructions[node.instructions[index + 1]].role_id,
  ];

  const getPrevInstructionIds = ({ node, index }) => [
    node.instructions[index - 1],
  ];

  const parseText2 = (text) => {
    let parsed_text = [];


    let char_map = [
      { char: "(", type: 'note', action: 'open', next_index: undefined },
      { char: ")", type: 'note', action: 'close', next_index: undefined },
      { char: "[", type: 'choice', action: 'open', next_index: undefined },
      { char: "]", type: 'choice', action: 'open', next_index: undefined }
    ]

    /*     let map = {
          "(": { type: 'note', action: 'open', next_index: undefined },
          ")": { type: 'note', action: 'close', next_index: undefined },
          "[": { type: 'choice', action: 'open', next_index: undefined },
          "]": { type: 'choice', action: 'close', next_index: undefined },
        } */

    if (parsed_text.length !== 0) {
      text = parsed_text.slice(-1)
    }
    char_map = map.map((data) => ({
      ...data,
      next_index: text.indexOf(char)
    }))

  }

  const parseText = (text) => {
    try {
      let parsed_text = [];
      text.split("").forEach(char => {
        let previous_node = parsed_text[parsed_text.length - 1];
        if (parsed_text.length === 0) {
          let type = 'normal'
          if (char === "[") {
            type = 'choice'
          } else if (char === "(") {
            type = 'note'
          } else {
            type = 'normal'
          }
          if (type === 'normal') {
            parsed_text.push({ type, text: type === 'normal' ? char : '' })
          } else {
            parsed_text.push({ type, text: type === 'normal' ? char : '', open: true })
          }
        } else {
          let type = 'normal'
          if (char === "[") {
            if (!previous_node.open)
              throw 'no nesting allowed'
            parsed_text.push({ type: 'choice', text: '', open: true })
            type = 'choice';
          } else if (char === "(") {
            if (!previous_node.open)
              throw 'no nesting allowed'
            parsed_text.push({ type: 'note', text: '', open: true })
          } else if (char === ")") {
            if (previous_node.type !== 'note')
              throw `the textnode before ) is not a note but a ${previous_node.type}`
            if (!previous_node.open)
              throw 'the textnode before ) has already been closed by a )'
            previous_node.open = false
          } else if (char === "]") {
            if (previous_node.type !== 'choice')
              throw `the textnode before ] is not a choice but a ${previous_node.type}`
            if (!previous_node.open)
              throw 'no nesting allowed'
            previous_node.open = false
          } else {
            if (previous_node.open)
              previous_node.text += char
            else
              parsed_text.push({ type: 'normal', text: char })
          }
        }


      })

      // let formatted_text = [{ type: "normal", content: text }];
    } catch (err) {
      console.error(err);
    }
  }

  const formatText = (text) => {
    let formatted_text = [{ type: "normal", content: text }];
    // regex
    const regex_for_brackets = /[\["](.*?)[\]"][.!?\\-]?/g;
    let matches = String(text).match(regex_for_brackets);
    if (!matches) return formatted_text;

    for (let i = matches.length - 1; i >= 0; i--) {
      let split = formatted_text.shift().content.split(`${matches[i]}`);

      let multi_choice = matches[i].replace("[", "").replace("]", "");
      let choices = multi_choice.split("/");

      formatted_text = [
        { type: "normal", content: split[0] },
        { type: "choice", content: choices },
        { type: "normal", content: split[1] },
        ...formatted_text,
      ];
    }
    return formatted_text;
  };

  const processInstructions = () => {
    try {
      return Object.fromEntries(
        Object.entries(state.script.nodes)
          .map(([node_id, node]) =>
            node.instructions.filter((instruction_id) => {
              if (state.script.instructions[instruction_id]) {
                return true
              } else {
                console.error('instruction_id', instruction_id, 'is not present in state.script.instructions', Object.keys(state.script.instructions))
                return false
              }
            }
            ).map((instruction_id, index) => {
              if (!state.script.instructions[instruction_id]) {
                throw ["instruction is undefined", instruction_id, state.script.instructions]
              }
              const instruction = {
                ...state.script.instructions[instruction_id],
              };
              if (!instruction)
                throw `could not find instruction_id ${instruction_id} in state.script.instructions`;
              if (instruction.type !== "video")
                instruction.text = formatText(instruction.text);

              instruction.timespan = parseInt(instruction.timespan);

              if (instruction.timespan === 0) {
                instruction.timespan = undefined;
              }
              return [
                instruction_id,
                {
                  ...instruction,
                  prev_instruction_ids:
                    index === 0
                      ? getPrevInstructionIdsOfFirst(node)
                      : getPrevInstructionIds({ node, index }),
                  next_role_ids:
                    index === node.instructions.length - 1
                      ? getNextRoleIdsOfLast(node)
                      : getNextRoleIds({ node, index }),
                },
              ];
            })
          )
          .reduce((a, b) => a.concat(b), [])
      );
    } catch (err) {
      console.error(`processInstructions : ${err}`);
      return false;
    }
  };

  const arraysMatch = (arr1, arr2) => {
    if (arr1.length !== arr2.length) return false;
    for (var i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  };


  this.processScript = async () => {
    try {
      let processed_roles = await controlRoles();

      // CHECK: MAKE SURE ALL ROLES ARE PRESENT
      console.log(Object.keys(state.script.roles), Object.keys(processed_roles))
      if (!arraysMatch(Object.keys(state.script.roles), Object.keys(processed_roles)))
        throw [
          'error in controlRoles(): processed_roles does not match with state.script.roles',
          Object.keys(state.script.roles),
          Object.keys(processed_roles)
        ]

      let errored_roles = Object.entries(processed_roles).filter(
        ([role_id, processed_role]) => !processed_role.success
      )

      if (errored_roles.length > 0)
        throw [`controlRoles had errors:`, errored_roles];

      let instructions = processInstructions();

      if (!instructions) throw `processInstructions failed`;

      let instructions_per_role = Object.fromEntries(
        Object.entries(state.script["roles"]).map(([role_id, role]) => [
          role_id,
          {
            name: role.name,
            instructions: processed_roles[role_id].node_ids
              .map((node_id) =>
                state.script.nodes[node_id].instructions
                  .filter(
                    (instruction_id) =>
                      instructions[instruction_id].role_id === role_id
                  )
                  .map((instruction_id) => {
                    const instruction = {
                      ...instructions[instruction_id],
                      instruction_id,
                    };
                    delete instruction.role_id;
                    return instruction;
                  })
              )
              .reduce((a, b) => a.concat(b), []),
          },
        ])
      );

      console.log(Object.keys(instructions_per_role))

      // check if instructions_per_role shows any artefacts:
      // are all the instructions really of the same role???
      // there was possibly a bug in which this 

      Object.entries(instructions_per_role).forEach(([role_id, role]) => {
        role.instructions.forEach(instruction => {
          if (state.script.instructions[instruction.instruction_id].role_id !== role_id) {
            throw [
              `error while filtering instructions_per_role with role_id ${role_id} and instruction_id ${instruction.instruction_id}`,
              instructions_per_role
            ]
          }
        })
      })

      return instructions_per_role
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  this.testProcessScript = () => {
    let i = 0;
    const MAX = 1000
    const iterate = async () => {
      let res = await this.processScript();
      if (!res) return
      i++;
      console.log('test ', i);
      if (i < MAX)
        setTimeout(iterate, 50)
    }
    iterate();
  }

  this.processVideo = (file, instruction_id) =>
    new Promise(async (resolve) => {
      const uploader = new Uploader();
      let start_time = new Date().getTime();
      setState("editor", "uploaders", start_time, { state: 'uploading', progress: { percentage: 0 }, instruction_id });
      uploader.onProgress = progress => {
        setState("editor", "uploaders", start_time, 'progress', progress)

        if (progress.percentage === 100) {
          setState("editor", "uploaders", start_time, 'state', 'processing')
        }
      }
      let result = await uploader.process(
        {
          url: `${urls.fetch}/api/uploadVideo/${state.script.script_id}/mp4`,
          data: {
            file,
            instruction_id,
          }
        }
      );

      if (result.success) {
        setState("editor", "uploaders", start_time, "state", 'completed');

      } else {
        setState("editor", "uploaders", start_time, "state", 'failed');
      }

      setTimeout(() => setState("editor", "uploaders", start_time, undefined), 2000)

      resolve(result);
    });


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
      y: state.editor.navigation.cursor.y,
    };

    selection.forEach((node_id) => {
      Object.keys(state.script.nodes[node_id].in_outs).forEach((role_id) => {
        group.in_outs[role_id] = {
          in_node_id: null,
          out_node_id: null,
        };
        node.in_outs[role_id] = {
          in_node_id: null,
          out_node_id: null,
        };
      });
    });

    // Object.keys(group.in_outs).forEach(role_id => )

    setState("script", "groups", group_id, group);
    setState("script", "nodes", uniqid(), node);

    selection.forEach((node_id) => {
      setState("script", "nodes", node_id, "parent_id", group_id);
    });
  };

  this.mergeSelectedNodes = () => {
    const selected_nodes = state.editor.selection.map(node_id => [node_id, state.script.nodes[node_id]]);
    let [root_node_id, root_node] = selected_nodes.shift();

    // save all the connections, instructions somewhere
    let all_in_outs = selected_nodes.map(([node_id, node]) => node.in_outs);
    let all_affected_role_ids = all_in_outs.map((in_outs, i, role_ids) =>
      Object.keys(in_outs).filter(role_id => role_ids.indexOf(role_id) === -1)
    );
    let all_instructions = selected_nodes.map(([node_id, node]) =>
      node.instructions.map(instruction_id =>
        [instruction_id, state.script.instructions[instruction_id]]
      )
    )

    // delete all groups except the first one
    selected_nodes.forEach(([node_id]) => removeNode(node_id))

    // re-connect all the connections to the first one (prioritize first one)
    all_in_outs.forEach(in_outs => {
      console.log('this happens', in_outs);
      Object.entries(in_outs).forEach(([role_id, in_out]) => {
        console.log(in_out, root_node_id, role_id);
        this.addRoleToNode({
          node_id: root_node_id,
          role_id
        });
        if (in_out.in_node_id) {
          console.log('add conneciton!!');
          this.addConnection({
            node_id: root_node_id,
            connecting_node_id: in_out.in_node_id,
            role_id,
            direction: 'in'
          })
        }
        if (in_out.out_node_id) {
          this.addConnection({
            node_id: root_node_id,
            connecting_node_id: in_out.out_node_id,
            role_id,
            direction: 'out'
          })
        }
      })
    })

    // add instructions back to root_node

    all_instructions.forEach(instructions => instructions.forEach(([instruction_id, instruction]) => {
      this.addInstruction({
        role_id: instruction.role_id,
        instruction,
        instruction_id
      })
      this.addInstructionIdToNode({
        node_id: root_node_id,
        instruction_id: instruction_id
      })
    }))
    console.log('merged all selected nodes');
    controlRoles(all_affected_role_ids);
  };


  this.saveScript = async () => {
    try {
      let processed_roles = await this.processScript();
      if (!processed_roles) {
        let result = await actions.openPrompt({
          type: "confirm",
          header: "the script is not playable, are you sure you want to save?",
        });
        if (!result) return;
      }

      let processed_nodes = Object.fromEntries(
        Object.entries(state.script.nodes).map(([node_id, node]) => {
          node = { ...node };
          delete node.visible;
          return [node_id, node];
        })
      );

      return await postData(`${urls.fetch}/api/script/save/${state.script.script_id}`, {
        development: {
          design_id: state.script.design_id,
          nodes: processed_nodes,
          instructions: state.script.instructions,
          roles: state.script.roles,
          groups: state.script.groups,
        },
        production: {
          design_id: state.script.design_id,
          roles: processed_roles,
        },
        script_id: state.script.script_id,
      });

    } catch (err) {
      console.error(err);
      return false;
    }
  };

  this.createGame = async () => {
    try {
      let roles = await this.processScript();

      if (!roles) throw "processScript failed";

      const { error } = await postData(
        `${urls.fetch}/api/script/test/${state.script.script_id}`,
        {
          roles,
          design_id: state.script.design_id,
        }
      );
      if (error) throw error;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  this.fetchGeneralData = async () => {
    let card_designs = await getData(`${urls.fetch}/api/design/get_all`);
    console.log(card_designs);
  };

  this.fetchScript = async () => {
    let data = await getData(
      `${urls.fetch}/api/script/get/${state.script.script_id}/development`
    );

    console.log("FETCH", data);

    if (!data) {
      actions.setBool("isInitialized", true);
      this.addRoleToScript();
      this.addRoleToScript();
      return;
    }

    batch(() => {
      this.setRoles(data.roles ? data.roles : {});
      this.setNodes(data.nodes);

      let instructions = data.instructions ? data.instructions : {};

      Object.entries(instructions)
        .filter(
          ([instruction_id, instruction]) =>
            instruction.type === "video" &&
            instruction.text !== "" &&
            !instruction.filesize
        )
        .forEach(async ([instruction_id, instruction]) => {
          const response = await fetch(urls.fetch + instruction.text, {
            method: "HEAD",
          });
          if (response.status === 200) {
            const filesize = response.headers.get("Content-Length");
            this.setFilesize({
              instruction_id,
              filesize,
            });
          }
        });

      this.setInstructions(data.instructions ? data.instructions : {});

      this.setGroups(data.groups ? data.groups : {});

      this.setDesignId(data.design_id ? data.design_id : "europalia3_mikey");
    });

  };
}
