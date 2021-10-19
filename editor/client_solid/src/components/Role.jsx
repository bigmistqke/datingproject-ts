import { createMemo, For, createEffect, onMount, createSignal } from "solid-js";
import "./Role.css";
import cursorEventHandler from "../helpers/cursorEventHandler";
import getColorFromHue from "../helpers/getColorFromHue";

import Bubble from "./Bubble";

const prevOrNext = (direction) =>
  direction === "out" ? "next_block_id" : "prev_block_id";
const oppositeDirection = (direction) => (direction === "out" ? "in" : "out");

function Role(props) {
  const [getDelay, setDelay] = createSignal();
  let role_dom;
  const startConnection = async (e, role_id) => {
    if (e.buttons != 1) return;

    let initially_connecting_block_id = props.role[prevOrNext(props.direction)];
    console.log(initially_connecting_block_id);

    // set editor-state connecting true so that hovering css is disabled
    props.storeManager.editor.setConnecting(true);
    // remove connections to roles 'both ways': dereference it in this and the connected block
    props.storeManager.script.blocks.removeConnectionBothWays({
      block_id: props.block_id,
      role_id: props.role_id,
      direction: props.direction,
    });

    // add a 'temporary connection' to temporary_connections in editor-state
    // this state is being represented with <TemporaryConnection>
    props.storeManager.editor.addTemporaryConnection({
      block_id: props.block_id,
      role_id: props.role_id,
      // next_block_id: initially_connecting_block_id,
      direction: props.direction,
      cursor: { x: e.clientX, y: e.clientY },
    });

    // add cursorEventHandler
    // (wrapper around onPointerDown, onPointerMove and onPointerUp)
    // it returns event onPointerUp
    let { target } = await cursorEventHandler();
    console.log(target);

    props.storeManager.editor.setConnecting(false);
    // remove temporary connection from editor-state
    props.storeManager.editor.removeTemporaryConnection({
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
        !props.storeManager.script.blocks.hasRoleId({
          block_id: connecting_block_id,
          role_id: props.role_id,
        })
      ) {
        props.storeManager.script.blocks.addRole({
          block_id: connecting_block_id,
          role_id: props.role_id,
        });
      }
      // adds a reference to block_id in role of block and connecting_block
      // and derefences any existing connection to that role of connecting_block_id
      props.storeManager.script.blocks.addConnection({
        block_id: props.block_id,
        connecting_block_id,
        role_id: props.role_id,
        direction: props.direction,
      });

      if (props.isShiftPressed && initially_connecting_block_id) {
        let end_block_id = await props.storeManager.process.getEndBlockId({
          role_id: props.role_id,
          block_id: connecting_block_id,
        });

        let { traversed_block_ids } =
          await props.storeManager.process.traverseRole({
            role_id: props.role_id,
            block_id: connecting_block_id,
          });
        console.log(traversed_block_ids, initially_connecting_block_id);
        if (traversed_block_ids.indexOf(initially_connecting_block_id) === -1) {
          props.storeManager.script.blocks.addConnection({
            block_id: end_block_id,
            connecting_block_id: initially_connecting_block_id,
            role_id: props.role_id,
            direction: props.direction,
          });
          props.storeManager.process.controlRole(props.role_id);
        }
      }
    } else if (
      target.classList.contains("map-container") &&
      props.isShiftPressed
    ) {
      let block_id = props.storeManager.script.blocks.addBlock();
      props.storeManager.script.blocks.addRole({
        block_id,
        role_id: props.role_id,
      });

      props.storeManager.script.blocks.addConnection({
        block_id: props.block_id,
        connecting_block_id: block_id,
        role_id: props.role_id,
        direction: props.direction,
      });
      if (initially_connecting_block_id) {
        props.storeManager.script.blocks.addConnection({
          block_id: block_id,
          connecting_block_id: initially_connecting_block_id,
          role_id: props.role_id,
          direction: props.direction,
        });
      }
    }

    props.storeManager.process.controlRole(props.role_id);
  };

  const updateRoleOffset = () =>
    props.storeManager.editor.updateRoleOffset({
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

    let target_role_id = await props.storeManager.editor.openPrompt({
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

    props.storeManager.script.blocks.convertRole({
      block_id: props.block_id,
      source_role_id: props.role_id,
      target_role_id,
    });

    return;
  };

  const removeOrConvertRole = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    props.storeManager.editor.addToSelectedBlockIds(props.block_id);

    let result = await props.storeManager.editor.openPrompt({
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
      await props.storeManager.script.blocks.removeRole({
        block_id: props.block_id,
        role_id: props.role_id,
      });
    } else {
      await convertRole();
    }

    props.storeManager.editor.emptySelectedBlockIds();
  };

  const showDescriptionAfterAWhile = () => {
    setDelay(
      setTimeout(() => {
        props.storeManager.editor.setTooltip(props.description);
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
          props.storeManager.editor.setTooltip(false);
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
