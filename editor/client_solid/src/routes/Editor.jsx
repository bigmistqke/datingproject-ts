import { createSignal, onMount, For } from "solid-js";
import { createStore } from "solid-js/store";

import { useParams } from "solid-app-router";

import getData from "../helpers/getData";
import postData from "../helpers/postData";

import Map from "../components/Map";
import ProgressBars from "../components/ProgressBars";
import Overlays from "../components/Overlays";
import Block from "../components/Block.jsx";
import Instruction from "../components/Instruction";
import Roles from "../components/Roles";
import Connection from "../components/Connection";

import NumericInput from "../components/NumericInput";
import SelectionBox from "../components/SelectionBox";

import DataProcessor from "../managers/DataProcessor";
import StoreManager from "../managers/StoreManager";

import VideoUploader from "../managers/VideoUploader";

import flatten, { unflatten } from "flat";

import "./Editor.css";

window.cursorPosition = {};
window.addEventListener("mousemove", (e) => {
  window.cursorPosition = { x: e.clientX, y: e.clientY };
});

window.unflatten = unflatten;
window.flatten = flatten;

function Editor(props) {
  const { script_id } = useParams();
  console.log("script_id", script_id);

  const isDev = window.location.href.indexOf("localhost") != -1;

  const urls = {
    mqtt: isDev ? "localhost:8883" : "socket.datingproject.net/mqtt",
    fetch: isDev ? "http://localhost:8080" : "https://fetch.datingproject.net",
    play: isDev ? "http://localhost:3001" : "https://play.datingproject.net",
    monitor: isDev
      ? "http://localhost:3004"
      : "https://monitor.datingproject.net",
  };

  let r_saveButton;

  // game-integral state
  const [scriptState, setScriptState] = createStore({
    blocks: {},
    roles: {},
    instructions: {},
  });

  const [editorState, setEditorState] = createStore({
    navigation: {
      cursor: {},
      origin: { x: 0, y: 0 },
      zoom: 1,
      zoomedOut: false,
    },
    gui: {
      overlay: null,
      selectionBox: null,
    },
    bools: {
      isConnecting: false,
      isInitialized: false,
      isShiftPressed: false,
      isCtrlPressed: false,
    },
    errors: {},
    selected_block_ids: [],
    role_offsets: {},
    block_dimensions: {},
  });

  /*     

    /*     const [getBlocks, setBlocks] = createStore({});
        const [getRoles, setRoles] = createSignal(["1", "2"]);
        const [getInstructions, setInstructions] = createStore({}); */

  // editor-specific state
  /*     
        //

        const [getSelectionBox, setSelectionBox] = createSignal(false);
        const [getInitialized, setInitialized] = createSignal(false); */

  // const [getSelectedBlockIds, setSelectedBlockIds] = createSignal([]);

  const storeManager = new StoreManager({
    scriptState,
    setScriptState,
    editorState,
    setEditorState,
    script_id,
  });

  const dataProcessor = new DataProcessor({});
  const videoUploader = new VideoUploader({
    script_id,
  });

  const updateData = (data) => {
    try {
      data = JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  };

  /* const visualizeErrors = async () => {
        
    } */

  const play = async () => {
    try {
      const processed_data = await dataProcessor.process({
        safe: true,
        ...scriptState,
      });

      if (!processed_data.success) return;

      let result = await postData(
        `${urls.fetch}/api/script/test/${script_id}`,
        processed_data
      );
      const { roles: _roles, room_url, error } = await result.json();

      if (error) console.error(error);

      window.open(`${urls.monitor}/${script_id}`);
    } catch (e) {
      console.error(e);
    }
  };

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
          storeManager.blocks.deleteSelectedBlocks();
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

  const save = async () => {
    let data = await dataProcessor.process({
      safe: false,
      ...scriptState,
    });

    if (!data.success) {
      return;
    }
    if (data.errors) {
      setEditorState("errors", data.errors);
    }

    r_saveButton.innerHTML = "saving...";

    data = await postData(`${urls.fetch}/api/script/save/${script_id}`, {
      ...data,
    });

    setTimeout(() => {
      r_saveButton.innerHTML = "saved!";
      setTimeout(() => {
        r_saveButton.innerHTML = "save";
      }, 2000);
    }, 1000);
    setHasChanged(false);
  };

  const changeRoles = (value) => {
    console.error("not implemented");
    /* let _roles = [];
        for (let i = 0; i < value; i++) {
            _roles.push(String(i + 1));
        }
        setRoles(_roles) */
  };

  const format = (num) => num + " roles";

  const renameKeyOfObject = (object, old_key, new_key) => {
    Object.defineProperty(
      object,
      new_key,
      Object.getOwnPropertyDescriptor(object, old_key)
    );
    delete object[old_key];
    return object;
  };

  const reformatBlocks = (blocks) =>
    blocks.map((block) => {
      block = renameKeyOfObject(block, "connections", "roles");
      return block;
    });

  const arrayOfObjectsToObject = (array, key) => {
    let object = {};
    array.forEach((element) => {
      object[element[key]] = element;
    });
    return object;
  };

  onMount(() => {
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);

    getData(`${urls.fetch}/api/script/get/${script_id}`)
      .then((res) => res.json())
      .then((res) => {
        if (!res) {
          return Promise.reject("error fetching data ", res);
        }

        // console.log(res.blocks);
        console.log();
        let blocks = reformatBlocks(res.blocks);
        blocks = arrayOfObjectsToObject(blocks, "block_id");
        console.log(res.instructions);
        setScriptState("instructions", res.instructions);
        setScriptState("blocks", blocks);

        /*  let blocks = {};
        res.blocks.forEach((b) => (blocks[b.block_id] = b));
        setScriptState("blocks", blocks); */

        /*         let blocks = {};
        res.blocks.forEach((b) => (blocks[b.block_id] = b));
        setScriptState("instructions", res.instructions);
        setScriptState("blocks", blocks);
        setScriptState("roles", res.roles);
        // setScriptState("roles", ["1", "2"]);

        setEditorState("bools", "isInitialized", true);
        console.info("yeeeeeha"); */
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

  return (
    <>
      {/* {
                        editorState.gui.overlay ?
                            <div
                                className="overlay-container"
                                onMouseDown={(e) => { if (Array.from(e.target.classList).indexOf('overlay-container') != -1) overlay.get().resolve(false) }}
                            >
                                {getOverlay(overlay.get())}
                            </div> : null
            } */}
      <div className="viewport" onMouseMove={mousemove}>
        <header className="flex">
          <h1 className="flexing">editor for script {script_id}</h1>

          <NumericInput
            type="number"
            onChange={changeRoles}
            min={2}
            step={1}
            precision={0}
            strict={true}
            value={roles ? roles.length : 2}
            format={format}
          />

          <button onClick={play}>play</button>

          <button onClick={save} ref={r_saveButton}>
            save
          </button>
        </header>

        <Map
          origin={editorState.navigation.origin}
          zoom={editorState.navigation.zoom}
          isShiftPressed={editorState.bools.isShiftPressed}
          storeManager={storeManager}
        >
          <For each={Object.values(scriptState.blocks)}>
            {(block, i) => {
              console.log("blokcoke");
              return (
                <Block
                  block_id={block.block_id}
                  position={block.position}
                  isSelected={
                    editorState.selected_block_ids.indexOf(block.block_id) != -1
                  }
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
                    //   errors={getConnectionError("start", props.errors)} // TODO: UPDATE ERROR HANDLING OF ROLE_PORTS
                    direction="in"
                  ></Roles>
                  <div className="instructions">
                    <For each={block.instructions}>
                      {(instruction_id, i) => {
                        if (!(instruction_id in scriptState.instructions)) {
                          console.error(
                            "block contains instruction_id which is not present in scriptState.instructions"
                          );
                          return;
                        }

                        let instruction =
                          scriptState.instructions[instruction_id];

                        return (
                          <Instruction
                            index={i}
                            key={instruction_id}
                            instruction_id={instruction_id}
                            timespan={instruction.timespan}
                            text={instruction.text}
                            type={instruction.type}
                            role_id={instruction.role_id}
                            sound={instruction.sound}
                            block_id={block.block_id}
                            roles={block.roles}
                            storeManager={storeManager}
                            videoUploader={videoUploader}
                            urls={urls}
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
                    //   errors={getConnectionError("end", props.errors)} // TODO: UPDATE ERROR HANDLING OF ROLE_PORTS
                    direction="out"
                  ></Roles>
                </Block>
              );
            }}
          </For>
          <For each={Object.values(scriptState.blocks)}>
            {(block) => (
              <For each={block.roles}>
                {(role, index) =>
                  role.next_block_id ? (
                    <Connection
                      prev_block_position={block.position}
                      role_offsets={editorState.role_offsets}
                      prev_block_id={block.block_id}
                      next_block_id={role.next_block_id}
                      role_id={role.role_id}
                      prev_role_offset={getRoleOffset({
                        block_id: block.block_id,
                        role_id: role.role_id,
                        direction: "out",
                      })}
                      next_block_position={
                        scriptState.blocks[role.next_block_id].position
                      }
                      next_role_offset={getRoleOffset({
                        block_id: role.next_block_id,
                        role_id: role.role_id,
                        direction: "in",
                      })}
                      cursor={editorState.navigation.cursor}
                    ></Connection>
                  ) : null
                }
              </For>
            )}
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
