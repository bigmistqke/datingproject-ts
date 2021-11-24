import { createSignal, onMount, For, Show } from "solid-js";
import { createStore } from "solid-js/store";

import { useParams } from "solid-app-router";

import getData from "../helpers/getData";
import postData from "../helpers/postData";
import arrayOfObjectsToObject from "../helpers/arrayOfObjectsToObject";

import Map from "../components/Map";
import ProgressBars from "../components/ProgressBars";
import Prompt from "../components/Prompt";
import Block from "../components/Block.jsx";
import Instruction from "../components/Instruction";
import Roles from "../components/Roles";
import Connection from "../components/Connection";
import TemporaryConnection from "../components/TemporaryConnection";
import Errors from "../components/Errors";
import TextArea from "../components/TextArea";
import Menu from "../components/Menu";
import Tooltip from "../components/Tooltip";

import NumericInput from "../components/NumericInput";
import SelectionBox from "../components/SelectionBox";

import DataProcessor from "../managers/DataProcessor";
import StoreManager from "../managers/StoreManager";

import getRandomHue from "../helpers/getRandomHue";

import flatten, { unflatten } from "flat";
import RoleAdmin from "../components/RoleAdmin";
import "./Editor.css";

import { useStore } from "../managers/Store";

import urls from "../urls";

window.cursorPosition = {};
window.addEventListener("mousemove", (e) => {
  window.cursorPosition = { x: e.clientX, y: e.clientY };
});

window.unflatten = unflatten;
window.flatten = flatten;

function Editor(props) {
  const [state, actions] = useStore();

  const { script_id } = useParams();

  const mousemove = (e) => actions.setCursor({ x: e.clientX, y: e.clientY });

  const keydown = (e) => {
    if (state.editor.bools.isCtrlPressed || e.metaKey) {
      switch (e.code) {
        case "KeyD":
          e.preventDefault();
          actions.duplicateSelectedBlocks({
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
          // actions.deleteSelectedBlocks();
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
      actions.emptySelectedBlockIds();
    }
  };

  const saveScript = async () => {
    let result = await actions.processScript();
    // TODO: ALLOW UNSAFE GAME TO BE SAVED!
    console.log("RESULT IS ", result);
    if (!result.success) return;

    console.log({ ...result.instructions });

    let response = await postData(
      `${urls.fetch}/api/script/save/${script_id}`,
      {
        blocks: state.script.blocks,
        instructions: result.instructions,
        roles: result.roles,
      }
    );

    console.log(response);
  };

  const createGame = async () => {
    let result = await actions.process();
    console.log("RESULT IS ", result);

    if (!result.success) return;

    actions.setInstructions(result.instructions);
    actions.setRoles(result.roles);

    const { error } = await postData(
      `${urls.fetch}/api/script/test/${script_id}`,
      state.script
    );
    if (error) console.error(error);
    actions.setSubMenu("monitor_menu");
  };

  const renameKeyOfObject = (object, old_key, new_key) => {
    console.log(object[old_key], old_key in object);
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

  const reformatBlocks = (_blocks) => {
    let blocks = {};
    _blocks.forEach((block) => {
      block = renameKeyOfObject(block, "connections", "roles");
      console.log(block, block.roles);
      /* block.roles = block.roles.map((role) => {
        console.log(role.next_block_id);
        if (!role.next_block_id) {
          delete role.next_block_id;
        }
        if (!role.prev_block_id) {
          delete role.prev_block_id;
        }
        return role;
      });
       */
      if (Array.isArray(block.roles)) {
        block.roles = arrayOfObjectsToObject(block.roles, "role_id");
      }
      blocks[block.block_id] = block;
      // return block;
    });
    return blocks;
  };

  onMount(() => {
    actions.setScriptId(script_id);

    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("mousemove", mousemove);

    getData(`${urls.fetch}/api/script/get/${script_id}`)
      .then((res) => res.json())
      .then((res) => {
        if (!res) {
          return Promise.reject("error fetching data ", res);
        }
        console.log(res.blocks, res.roles, res.instructions);
        actions.setRoles(res.roles);
        actions.setInstructions(res.instructions);
        actions.setBlocks(res.blocks);
      })
      .catch((err) => {
        console.error(err);
        actions.setBool("isInitialized", true);
      });

    window.addEventListener("beforeunload", (e) => {
      /*  if (!state.videoUploader.isUploading()) return;
      e.preventDefault();
      alert("please wait until all videos are uploaded"); */
    });
  });

  const GRID_SIZE = 1;

  return (
    <>
      <Show when={state.editor.gui.prompt}>
        <Prompt
          type={state.editor.gui.prompt.type}
          data={state.editor.gui.prompt.data}
          header={state.editor.gui.prompt.header}
          position={state.editor.navigation.cursor}
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
      <Menu saveScript={saveScript}></Menu>
      <div
        classList={{
          viewport: true,
          isConnecting: state.editor.bools.isConnecting,
          isTranslating: state.editor.bools.isTranslating,
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
          <For each={Object.values(state.script.blocks)}>
            {(block, i) => {
              return (
                <Block
                  block_id={block.block_id}
                  position={{
                    x: parseInt(block.position.x / GRID_SIZE) * GRID_SIZE,
                    y: parseInt(block.position.y / GRID_SIZE) * GRID_SIZE,
                  }}
                >
                  <Roles
                    block_id={block.block_id}
                    block={block}
                    roles={block.roles}
                    direction="in"
                  ></Roles>
                  <div className="instructions">
                    <For each={block.instructions}>
                      {(instruction_id, index) => {
                        if (!(instruction_id in state.script.instructions)) {
                          console.error(
                            `block contains instruction_id ${instruction_id} which is not present in state.script.instructions`
                          );
                          return;
                        }
                        let instruction =
                          state.script.instructions[instruction_id];

                        return (
                          <Instruction
                            index={index() + 1}
                            key={instruction_id}
                            instruction_id={instruction_id}
                            timespan={instruction.timespan}
                            text={instruction.text}
                            type={instruction.type}
                            role_id={instruction.role_id}
                            sound={instruction.sound}
                            block_id={block.block_id}
                            role_hue={
                              state.script.roles[instruction.role_id].hue
                            }
                            roles={Object.fromEntries(
                              Object.entries(state.script.roles).filter(
                                ([role_id, role]) =>
                                  Object.keys(block.roles).indexOf(role_id) !=
                                  -1
                              )
                            )}
                          />
                        );
                      }}
                    </For>
                  </div>

                  <Roles
                    block_id={block.block_id}
                    block={block}
                    roles={block.roles}
                    instructions={block.instructions}
                    direction="out"
                  ></Roles>
                </Block>
              );
            }}
          </For>

          <For each={state.editor.temporary_connections}>
            {(t_c) => (
              <TemporaryConnection
                role_hue={state.script.roles[t_c.role_id].hue}
                block_position={state.script.blocks[t_c.block_id].position}
                role_offset={actions.getRoleOffset({
                  block_id: t_c.block_id,
                  role_id: t_c.role_id,
                  direction: t_c.direction,
                })}
                next_block_id={t_c.next_block_id}
                next_block_position={
                  t_c.next_block_id
                    ? state.script.blocks[t_c.next_block_id].position
                    : null
                }
                next_role_offset={
                  t_c.next_block_id
                    ? actions.getRoleOffset({
                        block_id: t_c.next_block_id,
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
              Object.values(state.script.blocks).length > 0
                ? Object.values(state.script.blocks)
                : null
            }
          >
            {(block) => {
              return (
                <For each={Object.entries(block.roles)}>
                  {([role_id, role]) =>
                    role.next_block_id ? (
                      <Connection
                        next_block_id={role.next_block_id}
                        role_hue={state.script.roles[role_id].hue}
                        out_block_position={block.position}
                        out_role_offset={actions.getRoleOffset({
                          block_id: block.block_id,
                          role_id,
                          direction: "out",
                        })}
                        in_block_position={
                          state.script.blocks[role.next_block_id].position
                        }
                        in_role_offset={actions.getRoleOffset({
                          block_id: role.next_block_id,
                          role_id,
                          direction: "in",
                        })}
                      ></Connection>
                    ) : null
                  }
                </For>
              );
            }}
          </For>
          <Show when={state.editor.gui.selectionBox}>
            <SelectionBox data={state.editor.gui.selectionBox}></SelectionBox>
          </Show>
        </Map>
      </div>
      <ProgressBars></ProgressBars>
    </>
  );
}
export default Editor;
