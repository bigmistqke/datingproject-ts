import { createSignal, onMount, For } from "solid-js";
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

import VideoUploader from "../managers/VideoUploader";

import getRandomHue from "../helpers/getRandomHue";

import flatten, { unflatten } from "flat";
import RoleAdmin from "../components/RoleAdmin";
import "./Editor.css";

window.cursorPosition = {};
window.addEventListener("mousemove", (e) => {
  window.cursorPosition = { x: e.clientX, y: e.clientY };
});

window.unflatten = unflatten;
window.flatten = flatten;

function Editor(props) {
  const { script_id } = useParams();
  console.log("YEEHAA EDITOR", script_id);

  let r_saveButton;

  // game-integral state
  const [scriptState, setScriptState] = createStore({
    blocks: {},
    roles: {},
    instructions: {},
    description: "",
  });

  const [editorState, setEditorState] = createStore({
    navigation: {
      cursor: {},
      origin: { x: 0, y: 0 },
      zoom: 1,
      zoomedOut: false,
    },
    gui: {
      prompt: false,
      selectionBox: false,
      role_admin: false,
      tooltip: false,
      sub_menu: false,
    },
    bools: {
      isConnecting: false,
      isInitialized: false,
      isShiftPressed: false,
      isCtrlPressed: false,
      isMenuOpen: false,
      isTranslating: false,
    },
    errors: {},
    errored_block_ids: [],
    selected_block_ids: [],
    role_offsets: {},
    block_dimensions: {},
    temporary_connections: [],
  });

  const dataProcessor = new DataProcessor({ scriptState });

  const storeManager = new StoreManager({
    scriptState,
    setScriptState,
    editorState,
    setEditorState,
    script_id,
    dataProcessor,
  });

  const videoUploader = new VideoUploader({
    script_id,
  });

  const mousemove = (e) => {
    setEditorState("navigation", "cursor", { x: e.clientX, y: e.clientY });
  };

  const keydown = (e) => {
    if (editorState.bools.isCtrlPressed || e.metaKey) {
      switch (e.code) {
        case "KeyD":
          e.preventDefault();
          storeManager.blocks.duplicateSelectedBlocks({
            cursor,
            zoom: props.zoom,
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          storeManager.editor.zoomIn();
          break;
        case "ArrowDown":
          e.preventDefault();
          storeManager.editor.zoomOut();
          break;
      }
    } else {
      switch (e.key) {
        case "Backspace":
          // storeManager.blocks.deleteSelectedBlocks();
          break;
        case "Control":
          setEditorState("bools", "isCtrlPressed", true);
          break;
        case "Shift":
          setEditorState("bools", "isShiftPressed", true);
          break;
      }
    }
  };

  const keyup = (e) => {
    if (editorState.bools.isCtrlPressed && !e.ctrlKey) {
      setEditorState("bools", "isCtrlPressed", false);
    }
    if (editorState.bools.isShiftPressed && !e.shiftKey) {
      setEditorState("bools", "isShiftPressed", false);
      storeManager.editor.emptySelectedBlockIds();
    }
  };

  const saveScript = async () => {
    let result = await dataProcessor.process();
    // TODO: ALLOW UNSAFE GAME TO BE SAVED!
    console.log("RESULT IS ", result);
    if (!result.success) return;

    console.log({ ...result.instructions });

    let response = await postData(
      `${props.urls.fetch}/api/script/save/${script_id}`,
      {
        blocks: scriptState.blocks,
        instructions: result.instructions,
        roles: result.roles,
      }
    );

    console.log(response);
  };

  const createGame = async () => {
    let result = await dataProcessor.process();
    console.log("RESULT IS ", result);

    if (!result.success) return;

    setScriptState("instructions", result.instructions);
    setScriptState("roles", result.roles);

    const { error } = await postData(
      `${props.urls.fetch}/api/script/test/${script_id}`,
      scriptState
    );
    if (error) console.error(error);
    console.log("YEEEEEHAAA");
    storeManager.editor.setSubMenu("monitor_menu");
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
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("mousemove", mousemove);

    getData(`${props.urls.fetch}/api/script/get/${script_id}`)
      .then((res) => res.json())
      .then((res) => {
        if (!res) {
          return Promise.reject("error fetching data ", res);
        }

        setScriptState("roles", res.roles);
        setScriptState("instructions", res.instructions);
        setScriptState("blocks", res.blocks);
      })
      .catch((err) => {
        console.error(err);
        setEditorState("bools", "isInitialized", true);
      });

    window.addEventListener("beforeunload", (e) => {
      if (!videoUploader.isUploading()) return;
      e.preventDefault();
      alert("please wait until all videos are uploaded");
    });
  });

  const getRoleOffset = ({ block_id, role_id, direction }) => {
    return editorState.role_offsets[block_id] &&
      editorState.role_offsets[block_id][role_id] &&
      editorState.role_offsets[block_id][role_id][direction]
      ? editorState.role_offsets[block_id][role_id][direction]
      : null;
  };

  const GRID_SIZE = 1;

  const toggleMenu = () => {
    setEditorState("bools", "isMenuOpen", !editorState.bools.isMenuOpen);
  };

  return (
    <>
      {editorState.gui.prompt ? (
        <Prompt
          type={editorState.gui.prompt.type}
          data={editorState.gui.prompt.data}
          header={editorState.gui.prompt.header}
          position={editorState.navigation.cursor}
          resolve={editorState.gui.prompt.resolve}
          closePrompt={storeManager.editor.closePrompt}
          scriptState={scriptState}
          storeManager={storeManager}
        ></Prompt>
      ) : null}

      {editorState.gui.tooltip ? (
        <Tooltip
          text={editorState.gui.tooltip}
          cursor={editorState.navigation.cursor}
        ></Tooltip>
      ) : null}

      {/*       {editorState.gui.role_admin ? (
        <RoleAdmin
          scriptState={scriptState}
          storeManager={storeManager}
          isTranslating={editorState.bools.isTranslating}
        ></RoleAdmin>
      ) : null} */}

      {
        <Errors
          errors={[].concat.apply([], Object.values(editorState.errors))}
          storeManager={storeManager}
        ></Errors>
      }
      <Menu
        editorState={editorState}
        scriptState={scriptState}
        storeManager={storeManager}
        script_id={script_id}
        saveScript={saveScript}
        createGame={createGame}
        sub_menu={editorState.gui.sub_menu}
        urls={props.urls}
      ></Menu>
      <div
        classList={{
          viewport: true,
          isConnecting: editorState.bools.isConnecting,
          isTranslating: editorState.bools.isTranslating,
        }}
      >
        <button
          classList={{
            "menu-button": true,
            selected: editorState.bools.isMenuOpen,
          }}
          onMouseDown={toggleMenu}
        >
          +
        </button>

        <Map
          origin={editorState.navigation.origin}
          zoom={editorState.navigation.zoom}
          isShiftPressed={editorState.bools.isShiftPressed}
          storeManager={storeManager}
          sub_menu={editorState.gui.sub_menu}
        >
          <For each={Object.values(scriptState.blocks)}>
            {(block, i) => {
              return (
                <Block
                  block_id={block.block_id}
                  position={{
                    x: parseInt(block.position.x / GRID_SIZE) * GRID_SIZE,
                    y: parseInt(block.position.y / GRID_SIZE) * GRID_SIZE,
                  }}
                  selected_block_ids={editorState.selected_block_ids}
                  errored_block_ids={editorState.errored_block_ids}
                  isConnecting={editorState.bools.isConnecting}
                  errors={editorState.errors[block.block_id]}
                  zoom={editorState.navigation.zoom}
                  isCtrlPressed={editorState.bools.isCtrlPressed}
                  isShiftPressed={editorState.bools.isShiftPressed}
                  storeManager={storeManager}
                >
                  <Roles
                    block_id={block.block_id}
                    block={block}
                    roles={block.roles}
                    all_roles={scriptState.roles}
                    zoom={editorState.navigation.zoom}
                    origin={editorState.navigation.origin}
                    storeManager={storeManager}
                    isShiftPressed={editorState.bools.isShiftPressed}
                    //   errors={getConnectionError("start", props.errors)} // TODO: UPDATE ERROR HANDLING OF ROLE_PORTS
                    direction="in"
                  ></Roles>
                  <div className="instructions">
                    <For each={block.instructions}>
                      {(instruction_id, index) => {
                        if (!(instruction_id in scriptState.instructions)) {
                          console.error(
                            block.instructions,
                            instruction_id,
                            scriptState.instructions,
                            `block contains instruction_id ${instruction_id} which is not present in scriptState.instructions`
                          );
                          return;
                        }
                        let instruction =
                          scriptState.instructions[instruction_id];

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
                              scriptState.roles[instruction.role_id].hue
                            }
                            roles={Object.fromEntries(
                              Object.entries(scriptState.roles).filter(
                                ([role_id, role]) =>
                                  Object.keys(block.roles).indexOf(role_id) !=
                                  -1
                              )
                            )}
                            storeManager={storeManager}
                            videoUploader={videoUploader}
                            urls={props.urls}
                          />
                        );
                      }}
                    </For>
                  </div>

                  <Roles
                    block_id={block.block_id}
                    block={block}
                    roles={block.roles}
                    all_roles={scriptState.roles}
                    zoom={editorState.navigation.zoom}
                    origin={editorState.navigation.origin}
                    storeManager={storeManager}
                    instructions={block.instructions}
                    isShiftPressed={editorState.bools.isShiftPressed}
                    //   errors={getConnectionError("end", props.errors)} // TODO: UPDATE ERROR HANDLING OF ROLE_PORTS
                    direction="out"
                  ></Roles>
                </Block>
              );
            }}
          </For>

          <For each={editorState.temporary_connections}>
            {(t_c) => (
              <TemporaryConnection
                role_hue={scriptState.roles[t_c.role_id].hue}
                block_position={scriptState.blocks[t_c.block_id].position}
                role_offset={getRoleOffset({
                  block_id: t_c.block_id,
                  role_id: t_c.role_id,
                  direction: t_c.direction,
                })}
                next_block_id={t_c.next_block_id}
                next_block_position={
                  t_c.next_block_id
                    ? scriptState.blocks[t_c.next_block_id].position
                    : null
                }
                next_role_offset={
                  t_c.next_block_id
                    ? getRoleOffset({
                        block_id: t_c.next_block_id,
                        role_id: t_c.role_id,
                        direction: t_c.direction,
                      })
                    : null
                }
                direction={t_c.direction}
                origin={editorState.navigation.origin}
                cursor={editorState.navigation.cursor}
              ></TemporaryConnection>
            )}
          </For>

          <For
            each={
              Object.values(scriptState.blocks).length > 0
                ? Object.values(scriptState.blocks)
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
                        role_hue={scriptState.roles[role_id].hue}
                        out_block_position={block.position}
                        out_role_offset={getRoleOffset({
                          block_id: block.block_id,
                          role_id,
                          direction: "out",
                        })}
                        in_block_position={
                          scriptState.blocks[role.next_block_id].position
                        }
                        in_role_offset={getRoleOffset({
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
          {editorState.gui.selectionBox ? (
            <SelectionBox data={editorState.gui.selectionBox}></SelectionBox>
          ) : null}
        </Map>
      </div>
      <ProgressBars videoUploader={videoUploader}></ProgressBars>
    </>
  );
}
export default Editor;
