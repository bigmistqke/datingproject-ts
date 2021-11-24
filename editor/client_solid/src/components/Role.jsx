import { createMemo, For, createEffect, onMount, createSignal } from "solid-js";
import "./Role.css";
import dragHelper from "../helpers/dragHelper";
import getColorFromHue from "../helpers/getColorFromHue";

import Bubble from "./Bubble";

import { useStore } from "../managers/Store";

const prevOrNext = (direction) =>
  direction === "out" ? "next_block_id" : "prev_block_id";
const oppositeDirection = (direction) => (direction === "out" ? "in" : "out");

function Role(props) {
  const [state, actions] = useStore();

  const [getDelay, setDelay] = createSignal();
  let role_dom;
  const startConnection = async (e, role_id) => {
    if (e.buttons != 1) return;

    let initially_connecting_block_id = props.role[prevOrNext(props.direction)];
    console.log(initially_connecting_block_id);

    // set editor-state connecting true so that hovering css is disabled
    actions.setConnecting(true);
    // remove connections to roles 'both ways': dereference it in this and the connected block
    actions.removeConnectionBothWays({
      block_id: props.block_id,
      role_id: props.role_id,
      direction: props.direction,
    });

    // add a 'temporary connection' to temporary_connections in editor-state
    // this state is being represented with <TemporaryConnection>
    actions.addTemporaryConnection({
      block_id: props.block_id,
      role_id: props.role_id,
      // next_block_id: initially_connecting_block_id,
      direction: props.direction,
      cursor: { x: e.clientX, y: e.clientY },
    });

    // add dragHelper
    // (wrapper around onPointerDown, onPointerMove and onPointerUp)
    // it returns event onPointerUp
    let { target } = await dragHelper();
    console.log(target);

    actions.setConnecting(false);
    // remove temporary connection from editor-state
    actions.removeTemporaryConnection({
      block_id: props.block_id,
      role_id: props.role_id,
      direction: props.direction,
    });

    // check if target is the block to which this role belongs to
    if (
      target.id.replace("add_", "") === props.block_id ||
      target.id.replace("block_", "") === props.block_id
    ) {
      return;
    }
    // check if target is a block to which to connect to
    if (target.classList.contains("block")) {
      let connecting_block_id = target.id.replace("block_", "");
      // if it does not have a role yet in the block, add the role
      if (
        !actions.hasRoleId({
          block_id: connecting_block_id,
          role_id: props.role_id,
        })
      ) {
        actions.addRoleToBlock({
          block_id: connecting_block_id,
          role_id: props.role_id,
        });
      }
      // adds a reference to block_id in role of block and connecting_block
      // and derefences any existing connection to that role of connecting_block_id
      actions.addConnection({
        block_id: props.block_id,
        connecting_block_id,
        role_id: props.role_id,
        direction: props.direction,
      });

      if (props.isShiftPressed && initially_connecting_block_id) {
        let end_block_id = await actions.getEndBlockId({
          role_id: props.role_id,
          block_id: connecting_block_id,
        });

        let { traversed_block_ids } = await actions.traverseRole({
          role_id: props.role_id,
          block_id: connecting_block_id,
        });
        console.log(traversed_block_ids, initially_connecting_block_id);
        if (traversed_block_ids.indexOf(initially_connecting_block_id) === -1) {
          actions.addConnection({
            block_id: end_block_id,
            connecting_block_id: initially_connecting_block_id,
            role_id: props.role_id,
            direction: props.direction,
          });
          actions.controlRole(props.role_id);
        }
      }
    } else if (
      target.classList.contains("map-container") &&
      props.isShiftPressed
    ) {
      let block_id = actions.addBlock();
      actions.addRoleToBlock({
        block_id,
        role_id: props.role_id,
      });

      actions.addConnection({
        block_id: props.block_id,
        connecting_block_id: block_id,
        role_id: props.role_id,
        direction: props.direction,
      });
      if (initially_connecting_block_id) {
        actions.addConnection({
          block_id: block_id,
          connecting_block_id: initially_connecting_block_id,
          role_id: props.role_id,
          direction: props.direction,
        });
      }
    }

    actions.controlRole(props.role_id);
  };

  const updateRoleOffset = () =>
    actions.updateRoleOffset({
      block_id: props.block_id,
      role_id: props.role_id,
      direction: props.direction,
      offset: {
        x: role_dom.offsetLeft, // size of the border around the block
        y: role_dom.offsetTop, // size of the border around the block
        width: role_dom.offsetWidth,
        height: role_dom.offsetHeight,
      },
    });

  createEffect(() => {
    console.info(role_dom, props.instructions, props.roles);
    updateRoleOffset();
  });

  onMount(() => {
    updateRoleOffset();
    setTimeout(updateRoleOffset, 250);
  });

  /*   createEffect(() => {
    updateRoleOffset();
    setTimeout(updateRoleOffset, 250);
    // console.log("props.roles changed", props.roles);
  }, [props.roles]); */

  const convertRole = async () => {
    let remaining_roles = { ...props.roles };
    delete remaining_roles[props.role_id];

    let options = Object.entries(remaining_roles).map(([role_id, role]) => {
      return {
        value: role_id,
        background: getColorFromHue(props.all_roles[role_id].hue),
        color: "white",
      };
    });

    if (Object.keys(remaining_roles).length === 0) return;

    let target_role_id = await actions.openPrompt({
      type: "options",
      header: (
        <>
          <div>
            convert role
            <Bubble background_hue={props.role_hue}>{props.role_id}</Bubble>
          </div>
          <div>and its associated instructions</div>
          <div>
            from <span className="selected_blocks">selected block</span> into:
          </div>
        </>
      ),
      data: { options },
    });

    if (!!!target_role_id) return;

    actions.convertRole({
      block_id: props.block_id,
      source_role_id: props.role_id,
      target_role_id,
    });

    return;
  };

  const removeOrConvertRole = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    actions.addToSelectedBlockIds(props.block_id);

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
            from <span className="selected_blocks">selected block</span>
          </div>
        </>
      ),
      data: {
        options: ["remove", "convert"],
      },
    });

    if (!result) return;

    if (result === "remove") {
      await actions.removeRoleFromBlock({
        block_id: props.block_id,
        role_id: props.role_id,
      });
    } else {
      await convertRole();
    }

    actions.emptySelectedBlockIds();
  };

  const showDescriptionAfterAWhile = () => {
    setDelay(
      setTimeout(() => {
        actions.setTooltip(props.description);
      }, 1000)
    );
  };

  return (
    <span className="flexing role-container">
      <Bubble
        ref={role_dom}
        className="role"
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
    </span>
  );
}
export default Role;
