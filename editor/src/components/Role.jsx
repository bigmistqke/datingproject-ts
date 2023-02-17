import { createMemo, For, createEffect, onMount, createSignal } from "solid-js";
import dragHelper from "../helpers/dragHelper";
import getColorFromHue from "../helpers/getColorFromHue";

import Bubble from "./Bubble";

import { useStore } from "../managers/Store";
import { styled } from "solid-styled-components";

import { dragbox_container } from "./DragBox.module.css";
import styles from "./Role.module.css";

function Role(props) {
  const [state, actions] = useStore();

  const [getDelay, setDelay] = createSignal();

  let is_initialized = false;
  let role_dom;

  const startConnection = async (e, role_id) => {
    if (e.buttons != 1) return;

    // set editor-state connecting true so that hovering css is disabled
    actions.setConnecting(true);
    // remove connections to roles 'both ways': dereference it in this and the connected node
    actions.removeConnectionBothWays({
      node_id: props.node_id,
      role_id: props.role_id,
      direction: props.direction,
    });

    // add a 'temporary connection' to temporary_connections in editor-state
    // this state is being represented with <TemporaryConnection>
    actions.addTemporaryConnection({
      node_id: props.node_id,
      role_id: props.role_id,
      // out_node_id: initially_connected_node_id,
      direction: props.direction,
      cursor: actions.getCursor(),
    });

    // add dragHelper
    // (wrapper around onPointerDown, onPointerMove and onPointerUp)
    // it returns event onPointerUp
    let { target } = await dragHelper();

    actions.setConnecting(false);
    // remove temporary connection from editor-state
    actions.removeTemporaryConnection({
      node_id: props.node_id,
      role_id: props.role_id,
      direction: props.direction,
    });

    // check if target is the node to which this role belongs to
    if (
      target.id.replace("add_", "") === props.node_id ||
      target.id.replace("node_", "") === props.node_id
    ) {
      return;
    }
    // check if target is a node to which to connect to

    console.log("IS SHIFT PRESSED??? ", state.editor.bools.isShiftPressed);

    if (target.classList.contains(dragbox_container)) {
      let connecting_node_id = target.id.split("_")[1];
      // if it does not have a role yet in the node, add the role
      if (
        !actions.hasRoleId({
          node_id: connecting_node_id,
          role_id: props.role_id,
        })
      ) {
        actions.addRoleToNode({
          node_id: connecting_node_id,
          role_id: props.role_id,
        });
      }
      // adds a reference to node_id in role of node and connecting_node
      // and derefences any existing connection to that role of connecting_node_id
      actions.addConnection({
        node_id: props.node_id,
        connecting_node_id,
        role_id: props.role_id,
        direction: props.direction,
      });

      if (state.editor.bools.isShiftPressed && props.connected_node_id) {
        let end_node_id = await actions.getEndNodeId({
          role_id: props.role_id,
          node_id: connecting_node_id,
        });

        let { traversed_node_ids } = await actions.traverseRole({
          role_id: props.role_id,
          node_id: connecting_node_id,
        });
        if (traversed_node_ids.indexOf(props.connected_node_id) === -1) {
          actions.addConnection({
            node_id: end_node_id,
            connecting_node_id: props.connected_node_id,
            role_id: props.role_id,
            direction: props.direction,
          });
          actions.controlRole(props.role_id);
        }
      }
    } else if (
      target.classList.contains("map-container") &&
      state.editor.bools.isShiftPressed
    ) {
      let node_id = actions.addNode();
      actions.addRoleToNode({
        node_id,
        role_id: props.role_id,
      });

      actions.addConnection({
        node_id: props.node_id,
        connecting_node_id: node_id,
        role_id: props.role_id,
        direction: props.direction,
      });
      /*  if (props.connected_node_id) {
        actions.addConnection({
          node_id: node_id,
          connecting_node_id: props.connected_node_id,
          role_id: props.role_id,
          direction: props.direction,
        });
      } */
    }

    actions.controlRole(props.role_id);
  };

  const updateRoleOffset = () => {
    if (!role_dom) return;
    actions.updateRoleOffset({
      node_id: props.node_id,
      role_id: props.role_id,
      direction: props.direction,
      offset: {
        x: role_dom.offsetLeft + 1, // size of the border around the node
        y:
          props.direction === "out"
            ? role_dom.offsetTop + 5
            : role_dom.offsetTop, // size of the border around the node
        width: role_dom.offsetWidth,
        height: role_dom.offsetHeight,
      },
    });
    // }, 0);
  };

  createEffect(() => {
    // const instructions = props.instructions;
    if (!is_initialized && props.isVisible) {
      updateRoleOffset();
      is_initialized = true;
    }
  });

  createEffect(() => {
    const i = props.instructions;
    const u = props.updateRoleOffset;
    if (!props.isVisible) return;
    updateRoleOffset();
  });

  const convertRole = async () => {
    let remaining_roles = { ...props.in_outs };
    delete remaining_roles[props.role_id];

    let options = Object.entries(remaining_roles).map(([role_id, role]) => {
      return {
        value: role_id,
        background: getColorFromHue(props.all_roles[role_id].hue),
        color: "white",
      };
    });

    if (Object.keys(remaining_roles).length === 0) return;

    let [target_role_id] = await actions.openPrompt({
      type: "options",
      header: (
        <>
          <div>
            convert role
            <Bubble background_hue={props.role_hue}>{props.role_id}</Bubble>
          </div>
          <div>and its associated instructions</div>
          <div>
            from <span className="selected_nodes">selected node</span> into:
          </div>
        </>
      ),
      data: { options },
    });

    if (!!!target_role_id) return;

    actions.convertRoles({
      node_ids: [props.node_id],
      source_role_id: props.role_id,
      target_role_id,
    });

    return;
  };

  const removeOrConvertRole = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    let result = await actions.openPrompt({
      type: "options",
      header: (
        <>
          <div>
            remove or convert role{" "}
            <Bubble background_hue={props.role_hue}>{props.role_id}</Bubble>
          </div>
          <div>and its associated instructions</div>
          <div>
            from <span className="selected_nodes">selected node</span>
          </div>
        </>
      ),
      data: {
        options: ["remove", "convert"],
      },
    });

    if (!result) return;

    if (result === "remove") {
      await actions.removeRoleFromNode({
        node_id: props.node_id,
        role_id: props.role_id,
      });
    } else {
      await convertRole();
    }

    actions.emptySelection();
  };

  const showDescriptionAfterAWhile = () => {
    setDelay(
      setTimeout(() => {
        actions.setTooltip(props.description);
      }, 1000)
    );
  };

  const Role = styled(Bubble)`
    border-radius: 20px;
    background: white;
    text-align: center;
    box-sizing: border-box;
    line-height: var(--r-height);
    cursor: pointer;
    color: white;
    z-index: 50;
    font-size: 7pt;
    line-height: 8pt;
    pointer-events: all;
  `;

  const RolesContainer = styled("div")`
    text-align: center;
    flex: 1;
  `;

  return (
    <RolesContainer>
      <Bubble
        ref={role_dom}
        class={styles.role}
        onMouseEnter={showDescriptionAfterAWhile}
        onMouseOut={() => {
          clearTimeout(getDelay());
          actions.setTooltip(false);
        }}
        onPointerDown={(e) => {
          startConnection(e, props.role_id);
        }}
        onContextMenu={(e) => {
          removeOrConvertRole(e, props.role_id);
        }}
        background_hue={props.role_hue}
      >
        {props.name}
      </Bubble>
    </RolesContainer>
  );
}
export default Role;
