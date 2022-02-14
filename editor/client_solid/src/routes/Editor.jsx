import { onMount, For, Show, createEffect, batch } from "solid-js";
import { useParams } from "solid-app-router";

import getData from "../helpers/getData";
import postData from "../helpers/postData";
import arrayOfObjectsToObject from "../helpers/arrayOfObjectsToObject";

import Map from "../components/Map";
import ProgressBars from "../components/ProgressBars";
import Prompt from "../components/Prompt";
import Node from "../components/Node.jsx";

import Connection from "../components/Connection";
import TemporaryConnection from "../components/TemporaryConnection";
import Errors from "../components/Errors";
import Menu from "../components/Menu";
import Tooltip from "../components/Tooltip";

import getRandomHue from "../helpers/getRandomHue";

import flatten, { unflatten } from "flat";
import "./Editor.css";

import { useStore } from "../managers/Store";

import urls from "../urls";

import { styled } from "solid-styled-components";
import Bubble from "../components/Bubble";

import { DragBoxClassName } from "../components/DragBox";

/* window.cursorPosition = {};
window.addEventListener("mousemove", (e) => {
  window.cursorPosition = { x: e.clientX, y: e.clientY };
});
 */
window.unflatten = unflatten;
window.flatten = flatten;

function Editor(props) {
  const [state, actions] = useStore();

  let { script_id, parent_ids } = useParams();
  parent_ids = parent_ids ? parent_ids.split("/") : [];

  const mousemove = (e) => actions.setCursor({ x: e.clientX, y: e.clientY });

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
          actions.zoomIn();
          break;
        case "ArrowDown":
          e.preventDefault();
          actions.zoomOut();
          break;
      }
    } else {
      switch (e.key) {
        case "Backspace":
          // actions.deleteSelectedNodes();
          break;
        case "Control":
          actions.setBool("isCtrlPressed", true);
          break;
        case "Shift":
          actions.setBool("isShiftPressed", true);
          break;
      }
    }
  };

  const keyup = (e) => {
    if (state.editor.bools.isCtrlPressed && !e.ctrlKey) {
      actions.setBool("isCtrlPressed", false);
    }
    if (state.editor.bools.isShiftPressed && !e.shiftKey) {
      actions.setBool("isShiftPressed", false);
      // actions.emptySelection();
    }
  };

  const saveScript = async () => {
    try {
      let processed_roles = await actions.processScript();
      // console.log(state.script.nodes);
      if (!processed_roles) {
        let result = await actions.openPrompt({
          type: "confirm",
          header: "the script is not playable, are you sure you want to save?",
        });
        if (!result) return;
      }

      // remove node.visible

      console.log(processed_roles);

      let processed_nodes = Object.fromEntries(
        Object.entries(state.script.nodes).map(([node_id, node]) => {
          node = { ...node };
          delete node.visible;
          return [node_id, node];
        })
      );

      await postData(`${urls.fetch}/api/script/save/${script_id}`, {
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
      });
      // }
    } catch (err) {
      console.error(err);
    }
  };

  const createGame = async () => {
    try {
      let result = await actions.processScript();
      if (!result) throw "processScript failed";
      console.log("CREATE GAME", {
        roles: result,
        design_id: state.script.design_id,
      });
      const { error } = await postData(
        `${urls.fetch}/api/script/test/${script_id}`,
        {
          roles: result,
          design_id: state.script.design_id,
        }
      );
      if (error) throw error;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const renameKeyOfObject = (object, old_key, new_key) => {
    if (!(old_key in object)) return object;
    Object.defineProperty(
      object,
      new_key,
      Object.getOwnPropertyDescriptor(object, old_key)
    );
    delete object[old_key];

    return object;
  };

  let role_index = 0;

  const reformatRoles = (roles) => {
    for (let role_id in roles) {
      roles[role_id] = {
        instruction_ids: roles[role_id],
        hue: getRandomHue(role_index).toString(),
        description: "",
        name: role_id,
      };
      role_index++;
    }
    return roles;
  };

  const reformatBlocks = (blocks) => {
    let nodes = {};
    Object.entries(blocks).forEach(([block_id, block]) => {
      block = renameKeyOfObject(block, "roles", "in_outs");
      block.in_outs = Object.fromEntries(
        Object.entries(block.in_outs).map(([role_id, role]) => {
          if (role.next_block_id) {
            role.out_node_id = role.next_block_id;
            delete role.next_block_id;
          }
          if (role.prev_block_id) {
            role.in_node_id = role.prev_block_id;
            delete role.prev_block_id;
          }
          return [role_id, role];
        })
      );
      nodes[block_id] = block;
      // return node;
    });
    return nodes;
  };

  const reformatNodes = (_nodes) => {
    let nodes = {};
    if (!Array.isArray(_nodes)) return _nodes;
    _nodes.forEach((node) => {
      // node = renameKeyOfObject(node, "connections", "roles");
      /* node.in_outs = node.in_outs.map((role) => {
        if (role.next_block_id) {
          role.out_node_id = role.next_block_id;
          delete role.next_block_id;
        }
        if (role.prev_block_id) {
          role.in_node_id = role.prev_block_id;
          delete role.prev_block_id;
        }
        return role;
      }); */

      if (Array.isArray(node.in_outs)) {
        node.in_outs = arrayOfObjectsToObject(node.in_outs, "role_id");
      }
      nodes[node.node_id] = node;
      // return node;
    });
    return nodes;
  };

  /*   const addRootToNodes = (nodes) =>
    Object.fromEntries(
      Object.entries(nodes).map(([node_id, node]) => [
        node_id,
        { ...node, parent: "root" },
      ])
    ); */

  const fetchScript = () => {
    let timestamp = new Date().getTime();
    getData(`${urls.fetch}/api/script/get/${script_id}/development`)
      .then((res) => res.json())
      .then((res) => {
        if (!res) {
          return Promise.reject("error fetching data ", res);
        }

        batch(() => {
          console.log("data fetched", res, new Date().getTime() - timestamp);
          timestamp = new Date().getTime();

          actions.setRoles(res.roles ? res.roles : {});
          console.log("setRoles", new Date().getTime() - timestamp);
          timestamp = new Date().getTime();

          let instructions = res.instructions ? res.instructions : {};
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
                console.log(instruction_id, filesize);
                actions.setFilesize({
                  instruction_id,
                  filesize,
                });
              }
            });

          actions.setInstructions(res.instructions ? res.instructions : {});
          console.log("setInstructions", new Date().getTime() - timestamp);
          timestamp = new Date().getTime();

          actions.setGroups(res.groups ? res.groups : {});
          console.log("setGroups", new Date().getTime() - timestamp);
          timestamp = new Date().getTime();

          // actions.iterateNodes(Object.entries(res.nodes));
          console.log("nodes", res.nodes);
          actions.setNodes(res.nodes);
          console.log("SETDESIGNID", res.design_id);
          actions.setDesignId(res.design_id ? res.design_id : "oldie_3");
          console.log("setNodes", new Date().getTime() - timestamp);
        });
        console.log("batch state", new Date().getTime() - timestamp);
      })
      .catch((err) => {
        console.error(err);
        actions.setBool("isInitialized", true);
        actions.addRoleToScript();
        actions.addRoleToScript();
      });
  };

  onMount(() => {
    actions.setParentIds(parent_ids);

    if (state.script.script_id) return;
    actions.setScriptId(script_id);

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("mousemove", mousemove);

    fetchScript();

    window.addEventListener("beforeunload", (e) => {
      /*  if (!state.videoUploader.isUploading()) return;
      e.preventDefault();
      alert("please wait until all videos are uploaded"); */
    });
  });

  const GRID_SIZE = 1;

  const SelectionBox = styled("div")`
    position: absolute;
    border: 2px dashed white;
    pointer-events: none;
    z-index: 2;
    background: #836dc841;
  `;

  const VisitedGroupIds = styled("div")`
    position: absolute;
    top: 6px;
    right: 6px;
    z-index: 5;
  `;

  const Viewport = styled("div")`
    &.isConnecting .${DragBoxClassName} > * {
      pointer-events: none !important;
    }
  `;

  /*  */

  return (
    <>
      <Show when={state.editor.gui.prompt}>
        <Prompt
          type={state.editor.gui.prompt.type}
          data={state.editor.gui.prompt.data}
          header={state.editor.gui.prompt.header}
          position={
            state.editor.gui.prompt.position
              ? state.editor.gui.prompt.position
              : state.editor.navigation.cursor
          }
          resolve={state.editor.gui.prompt.resolve}
        ></Prompt>
      </Show>
      <Show when={state.editor.gui.prompt}>
        <Tooltip
          text={state.editor.gui.tooltip}
          cursor={state.editor.navigation.cursor}
        ></Tooltip>
      </Show>
      <Errors
        errors={[].concat.apply([], Object.values(state.editor.errors))}
      ></Errors>
      <Menu createGame={createGame} saveScript={saveScript}></Menu>
      <Show when={state.editor.visited_parent_ids.length > 0}>
        <VisitedGroupIds>
          <For each={state.editor.visited_parent_ids}>
            {(parent_id, index) => (
              <Bubble
                onClick={() => actions.enterVisitedGroup({ parent_id, index })}
                background_color="grey"
                color="white"
              >
                hallo
              </Bubble>
            )}
          </For>
        </VisitedGroupIds>
      </Show>
      <Viewport
        classList={{
          viewport: true,
          isConnecting: state.editor.bools.isConnecting,
          isTranslating: state.editor.bools.isTranslating,
          isZoomedOut: state.editor.bools.isZoomedOut,
        }}
      >
        <button
          classList={{
            "menu-button": true,
            selected: state.editor.bools.isMenuOpen,
          }}
          onMouseDown={() => actions.setBool("isMenuOpen", (bool) => !bool)}
        >
          +
        </button>

        <Map>
          {/* <div style={{ "pointer-events": "none" }}>
            <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}>
              {(index) => (
                <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}>
                  {(index2) => (
                    <div
                      style={{
                        
                        position: "absolute",
                        border: "5px solid black",
                        height: state.editor.navigation.grid_size + "px",
                        width: state.editor.navigation.grid_size + "px",
                        left: index * state.editor.navigation.grid_size + "px",
                        top: index2 * state.editor.navigation.grid_size + "px",
                      }}
                    ></div>
                  )}
                </For>
              )}
            </For>
          </div> */}

          <For each={Object.keys(state.script.nodes)}>
            {(node_id, i) => {
              const node = state.script.nodes[node_id];
              return (
                <Show
                  key={node_id}
                  when={node.parent_id === parent_ids[parent_ids.length - 1]}
                >
                  <Node
                    node={node}
                    node_id={node_id}
                    instructions={node.instructions}
                    in_outs={node.in_outs}
                    dimensions={node.dimensions}
                    visible={node.visible}
                    position={{
                      x: parseInt(node.position.x / GRID_SIZE) * GRID_SIZE,
                      y: parseInt(node.position.y / GRID_SIZE) * GRID_SIZE,
                    }}
                  ></Node>
                </Show>
              );
            }}
          </For>

          <For each={state.editor.temporary_connections}>
            {(t_c) => (
              <TemporaryConnection
                role_hue={state.script.roles[t_c.role_id].hue}
                node_position={state.script.nodes[t_c.node_id].position}
                role_offset={actions.getRoleOffset({
                  node_id: t_c.node_id,
                  role_id: t_c.role_id,
                  direction: t_c.direction,
                })}
                out_node_id={t_c.out_node_id}
                next_node_position={
                  t_c.out_node_id
                    ? state.script.nodes[t_c.out_node_id].position
                    : null
                }
                next_role_offset={
                  t_c.out_node_id
                    ? actions.getRoleOffset({
                        node_id: t_c.out_node_id,
                        role_id: t_c.role_id,
                        direction: t_c.direction,
                      })
                    : null
                }
                direction={t_c.direction}
              ></TemporaryConnection>
            )}
          </For>

          <For
            each={
              Object.values(state.script.nodes) &&
              Object.values(state.script.nodes).length > 0
                ? Object.entries(state.script.nodes)
                : null
            }
          >
            {([node_id, node]) => (
              <Show
                when={
                  node.parent_id === parent_ids[parent_ids.length - 1] ||
                  !node.parent_id
                }
              >
                <For each={Object.entries(node.in_outs)}>
                  {([role_id, role]) =>
                    role.out_node_id ? (
                      <Connection
                        out_node_id={role.out_node_id}
                        role_hue={state.script.roles[role_id].hue}
                        out_node_position={node.position}
                        out_role_offset={actions.getRoleOffset({
                          node_id: node_id,
                          role_id,
                          direction: "out",
                        })}
                        in_node_position={
                          state.script.nodes[role.out_node_id]
                            ? state.script.nodes[role.out_node_id].position
                            : { x: 0, y: 0 }
                        }
                        in_role_offset={actions.getRoleOffset({
                          node_id: role.out_node_id,
                          role_id,
                          direction: "in",
                        })}
                      ></Connection>
                    ) : null
                  }
                </For>
              </Show>
            )}
          </For>
          <Show when={state.editor.gui.selectionBox}>
            <SelectionBox style={state.editor.gui.selectionBox}></SelectionBox>
          </Show>
        </Map>
      </Viewport>
      <ProgressBars></ProgressBars>
    </>
  );
}
export default Editor;
