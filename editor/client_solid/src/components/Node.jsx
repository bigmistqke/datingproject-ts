import {
  createMemo,
  createEffect,
  For,
  createSignal,
  Switch,
  onMount,
  on,
} from "solid-js";
import { useStore } from "../managers/Store";
// components
import InOuts from "./InOuts";
import Bubble from "./Bubble";
import DragBox from "./DragBox";
// helpers
import getColorFromHue from "../helpers/getColorFromHue";
import { overlaps } from "../helpers/collisionDetection";

import Instructions from "./Instructions";

import styles from "./InOuts.module.css";
import { Row } from "./UI_Components";

function Node(props) {
  let dom;

  const [state, actions, q] = useStore();

  const [isInitialized, setIsInitialized] = createSignal(false);
  const [updateRoleOffset, setUpdateRoleOffset] = createSignal(
    performance.now()
  );

  const isSelected = createMemo(
    () => state.editor.selection.indexOf(props.node_id) !== -1
  );

  const isErrored = createMemo(
    () => state.editor.errored_node_ids.indexOf(props.node_id) != -1,
    [state.editor.errored_node_ids]
  );

  const isVisible = createMemo(
    () => props.visible && state.editor.navigation.zoom > 0.125
  );

  const checkSelectionBox = () => {
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
    } else if (!isSelected() && collision) {
      actions.addToSelection(props.node_id);
    }
  };

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
      data: { options: ["delete", "copy", "merge", "convert roles"] },
      header:
        state.editor.selection.length == 1 ? `adjust node` : `adjust nodes`,
    });

    switch (result) {
      case "delete":
        let result = await actions.openPrompt({
          type: "confirm",
          header: "are you sure you?",
        });
        if (!result) return;
        var { role_ids } = actions.removeSelectedNodes();
        role_ids.forEach((role_id) => actions.controlRole(role_id));
        break;
      case "copy":
        actions.duplicateSelectedNodes();
        break;
      case "group":
        actions.groupSelectedNodes();
        break;
      case "merge":
        actions.mergeSelectedNodes();
        break;
      case "convert roles":
        convertRoles();
        break;
      default:
        break;
    }
  };

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

  createEffect(
    on(
      () => props.instructions.length,
      () => {
        if (!dom) return;
        updateNodeDimensions();
      }
    )
  );

  createEffect(checkSelectionBox);

  createEffect(() => {
    console.log("Instruction", props.node.instructions);
  });

  onMount(() => {
    if (props.node.type === "start" && props.instructions.length === 0) {
      for (let role_id in state.script.roles) {
        actions.addRoleToNode({
          node_id: props.node_id,
          role_id,
        });
      }

      const [admin_id] = Object.entries(state.script.roles).find(
        ([role_id, role]) => role.name === "admin"
      );

      let { instruction_id } = actions.addInstruction({ role_id: admin_id });
      console.log("instruction_id", instruction_id, props.node_id);
      actions.addInstructionIdToNode({
        node_id: props.node_id,
        instruction_id,
      });
    }
  });

  return (
    <DragBox
      id={props.node_id}
      onContextMenu={contextMenu}
      position={props.position}
      instructions={props.instructions}
      isSelected={isSelected()}
      isVisible={isVisible()}
      isErrored={isErrored()}
      ref={dom}
      style={{
        height:
          isInitialized() || !props.dimensions
            ? ""
            : props.dimensions.height + "px",
      }}
    >
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          height: "100%",
        }}
      >
        <Switch fallback={<Row class={styles.roles_row}></Row>}>
          <Match when={!props.node.type || props.node.type !== "start"}>
            <InOuts
              node_id={props.node_id}
              node={props.node}
              in_outs={props.node.type !== "start" ? props.in_outs : {}}
              direction="in"
              isVisible={true}
              updateRoleOffset={updateRoleOffset()}
              visible={props.visible}
            />
          </Match>
        </Switch>

        <Switch
          fallback={
            <Row
              class={styles.roles_row}
              style={{
                "align-content": "center",
                "align-items": "center",
                "flex-direction": "column",
              }}
            >
              <Bubble style={{ color: "black", background: "white" }}>
                {props.node.type?.toUpperCase()}
              </Bubble>
            </Row>
          }
        >
          <Match when={!props.node.type || props.node.type === "instruction"}>
            <Instructions
              instructions={props.instructions}
              isVisible={isVisible()}
              state={state}
              updateNodeDimensions={updateNodeDimensions}
              node_id={props.node_id}
              node={props.node}
              in_outs={props.in_outs}
            />
          </Match>
        </Switch>

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
        />
      </div>
    </DragBox>
  );
}

export default Node;
