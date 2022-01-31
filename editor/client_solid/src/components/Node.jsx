import { DragBox } from "./DragBox";
import dragHelper from "../helpers/dragHelper";
import { createMemo, createEffect, For, onMount, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { useStore } from "../managers/Store";

import InOuts from "./InOuts";
import Instruction from "./Instruction";
import Bubble from "./Bubble";

import { styled } from "solid-styled-components";
import getColorFromHue from "../helpers/getColorFromHue";

import { overlaps } from "../helpers/collisionDetection";

function Node(props) {
  const [state, actions, q] = useStore();

  // const [isVisible, setIsVisible] = createSignal(false);
  const [isInitialized, setIsInitialized] = createSignal(false);

  const isSelected = createMemo(
    () => state.editor.selection.indexOf(props.node_id) !== -1
  );

  const [updateRoleOffset, setUpdateRoleOffset] = createSignal(
    performance.now()
  );
  let dom;

  createEffect(() => {
    if (!dom) return;
    actions.observe({ dom });
  });

  createEffect(() => {
    if (isVisible() && !isInitialized()) {
      setIsInitialized(true);
      actions.unobserve({ dom });
    }
  });

  /*   onMount(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 0);
  }); */

  createEffect(() => {
    if (!dom) return;
    let i = props.instructions;
    updateNodeDimensions();
  });

  const updateNodeDimensions = () => {
    actions.setNodeDimensions({
      node_id: props.node_id,
      width: dom.offsetWidth,
      height: dom.offsetHeight,
    });
    setUpdateRoleOffset(performance.now());
  };

  const convertRoles = async () => {
    let all_roles = Object.entries(state.script.roles).map(
      ([role_id, role]) => ({
        value: role_id,
        label: role.name,
        background: getColorFromHue(role.hue),
        color: "white",
      })
    );

    let selected_roles = [
      ...new Set(
        state.editor.selection
          .map((node_id) => Object.keys(state.script.nodes[node_id].in_outs))
          .reduce((a, b) => a.concat(b), [])
      ),
    ]
      .sort((a, b) => state.script.roles[a].name > state.script.roles[b].name)
      .map((role_id) => all_roles.find((v) => v.value === role_id));

    let position = JSON.parse(JSON.stringify(state.editor.navigation.cursor));

    let source_role_id = await actions.openPrompt({
      type: "options",
      header: "Select a role to convert",
      data: {
        options: selected_roles,
      },
      position,
    });

    if (!source_role_id) return;

    let target_role_id = await actions.openPrompt({
      type: "options",
      header: (
        <>
          <div>
            convert role
            <Bubble background_hue={props.role_hue}>{source_role_id}</Bubble>
            into:
          </div>
        </>
      ),
      data: {
        options: all_roles.filter((v) => v.value !== source_role_id),
      },
      position,
    });

    if (!target_role_id) return;

    actions.convertRole({
      node_ids: state.editor.selection,
      source_role_id,
      target_role_id,
    });
  };

  const contextMenu = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    actions.addToSelection(props.node_id);

    let result = await actions.openPrompt({
      type: "options",
      data: { options: ["delete", "copy", "group", "convert roles"] },
      header:
        state.editor.selection.length == 1 ? `adjust node` : `adjust nodes`,
    });

    console.log("result openPrompt");
    console.log(result);
    switch (result) {
      case "delete":
        let result = await actions.openPrompt({
          type: "confirm",
          header: "are you sure you?",
        });
        if (!result) return;
        var { role_ids } = actions.removeSelectedNodes();
        role_ids.forEach((role_id) => {
          {
            actions.controlRole(role_id);
          }
        });
        break;
      case "copy":
        actions.duplicateSelectedNodes();
        /*  role_ids.forEach((role_id) => {
          {
            actions.controlRole(role_id);
          }
        }); */
        break;
      case "group":
        console.info("imlement group");
        actions.groupSelectedNodes();
        break;
      case "convert roles":
        console.info("imlement group");
        convertRoles();
        break;
      default:
        break;
    }
  };

  const isErrored = createMemo(
    () => state.editor.errored_node_ids.indexOf(props.node_id) != -1,
    [state.editor.errored_node_ids]
  );

  const addRow = () => {
    let { instruction_id } = actions.addInstruction(
      Object.keys(props.in_outs)[0]
    );
    actions.addInstructionId({
      node_id: props.node_id,
      instruction_id: instruction_id,
      prev_instruction_id: props.instruction_id,
      index: 0,
    });
  };

  const Instructions = styled("div")`
    /* pointer-events: all; */
    flex: 1;
  `;

  const isVisible = createMemo(
    () => props.visible && state.editor.navigation.zoom > 0.125
  );

  createEffect(() => {
    let selection_box = actions.getSelectionBox();

    if (!dom || !selection_box) return;

    const collision = overlaps(
      [
        { ...props.position },
        {
          x: props.position.x + dom.offsetWidth,
          y: props.position.y + dom.offsetHeight,
        },
      ],
      [
        {
          x: parseInt(selection_box.left),
          y: parseInt(selection_box.top),
        },
        {
          x: parseInt(selection_box.left) + parseInt(selection_box.width),
          y: parseInt(selection_box.top) + parseInt(selection_box.height),
        },
      ]
    );

    if (isSelected() && !collision && !state.editor.bools.isCtrlPressed) {
      actions.removeFromSelection(props.node_id);
    }
    if (!isSelected() && collision) {
      console.log("add to seleciton!!!");
      actions.addToSelection(props.node_id);
    }
  });

  return (
    <DragBox
      id={props.node_id}
      classList={{
        node: true,
        /*  isConnecting: state.editor.bools.isConnecting,
        isTranslating: state.editor.bools.isTranslating, */
        isErrored: isErrored(),
      }}
      onContextMenu={contextMenu}
      position={props.position}
      instructions={props.instructions}
      isSelected={isSelected()}
      isVisible={isVisible()}
      ref={dom}
      style={{
        height:
          isInitialized() || !props.dimensions
            ? ""
            : props.dimensions.height + "px",
        // "box-shadow": isVisible() ? "var(--dark-shadow)" : "",
      }}
    >
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          height: "100%",
        }}
      >
        <InOuts
          node_id={props.node_id}
          node={props.node}
          in_outs={props.in_outs}
          direction="in"
          isVisible={true}
          updateRoleOffset={updateRoleOffset()}

          // isVisible={isVisible()}
        ></InOuts>
        {
          <Instructions
            style={{
              "pointer-events": isVisible() ? "all" : "none",
            }}
          >
            <div
              style={{
                visibility: isVisible() ? "" : "hidden",
                // display: isVisible() ? "" : "none",
              }}
            >
              <Show
                when={
                  (props.node.type === "instruction" || !props.node.type) &&
                  isInitialized()
                }
              >
                <Show when={props.instructions.length === 0}>
                  <button onClick={addRow}>add new row</button>
                </Show>
                <For each={props.instructions}>
                  {(instruction_id, index) => {
                    if (!(instruction_id in state.script.instructions)) {
                      console.error(
                        `node contains instruction_id ${instruction_id} which is not present in state.script.instructions`
                      );
                      return;
                    }
                    let instruction = state.script.instructions[instruction_id];

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
                        node_id={props.node_id}
                        role_hue={state.script.roles[instruction.role_id].hue}
                        in_outs={props.in_outs}
                        updateNodeDimensions={updateNodeDimensions}
                      />
                    );
                  }}
                </For>
              </Show>
            </div>
          </Instructions>
        }
        <Show when={props.node.type === "group"}>
          <div style={{ "text-align": "center", padding: "6px" }}>
            <Bubble
              onClick={() => actions.enterGroup(props.node.group_id)}
              background_color="var(--dark-grey)"
              color="black"
            >
              open group
            </Bubble>
          </div>
        </Show>
        <InOuts
          node_id={props.node_id}
          node={props.node}
          in_outs={props.in_outs}
          isVisible={true}
          // isVisible={isVisible()}
          instructions={props.instructions}
          direction="out"
          updateRoleOffset={updateRoleOffset()}
        ></InOuts>
      </div>
    </DragBox>
  );
}

export default Node;
