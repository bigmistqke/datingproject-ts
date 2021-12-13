import DragBox from "./DragBox";
import dragHelper from "../helpers/dragHelper";
import { createMemo, createEffect, For, onMount } from "solid-js";
import { createStore } from "solid-js/store";
import { useStore } from "../managers/Store";

import InOuts from "./InOuts";
import Instruction from "./Instruction";
import Bubble from "./Bubble";

function Node(props) {
  const [state, actions, q] = useStore();

  const contextMenu = async (e) => {
    e.stopPropagation();
    e.preventDefault();

    actions.addToSelection(props.node_id);

    let result = await actions.openPrompt({
      type: "options",
      data: { options: ["delete", "copy", "group"] },
      header: "adjust node",
    });
    switch (result) {
      case "delete":
        let result = await actions.openPrompt({
          type: "confirm",
          header: "are you sure you?",
        });
        if (!result) return;
        let { role_ids } = actions.removeSelectedNodes();
        role_ids.forEach((role_id) => {
          {
            actions.controlRole(role_id);
          }
        });
        break;
      case "duplicate":
        console.info("should implement duplicating nodes");
        break;
      case "group":
        console.info("imlement group");
        actions.groupSelectedNodes();
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

  return (
    <DragBox
      id={props.node_id}
      classList={{
        node: true,
        isConnecting: state.editor.bools.isConnecting,
        isTranslating: state.editor.bools.isTranslating,
        isErrored: isErrored(),
      }}
      onContextMenu={contextMenu}
      position={props.position}
      instructions={props.instructions}
    >
      <InOuts
        node_id={props.node_id}
        node={props.node}
        in_outs={props.in_outs}
        direction="in"
        isVisible={true}
        // isVisible={isVisible()}
      ></InOuts>
      <Show when={props.node.type === "instruction" || !props.node.type}>
        <div className="instructions">
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
                />
              );
            }}
          </For>
        </div>
      </Show>
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
      ></InOuts>
    </DragBox>
  );
}

export default Node;
