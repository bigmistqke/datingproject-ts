import { createMemo, For, createEffect, onMount } from "solid-js";
import "./Roles.css";
import cursorEventHandler from "../helpers/cursorEventHandler";

function Role(props) {
  let role_dom;
  //   console.log("ROOOOOOOOOOOOOOOOOOOLES");
  const startConnection = async (e, role_id) => {
    props.storeManager.editor.setConnecting(true);
    props.storeManager.script.blocks.removeConnection({
      block_id: props.block_id,
      role_id: props.role_id,
      direction: props.direction,
    });

    props.storeManager.editor.addTemporaryConnection({
      block_id: props.block_id,
      role_id: props.role_id,
      direction: props.direction,
      cursor: { x: e.clientX, y: e.clientY },
    });
    let { target } = await cursorEventHandler();

    props.storeManager.editor.setConnecting(false);

    props.storeManager.editor.removeTemporaryConnection({
      block_id: props.block_id,
      role_id: props.role_id,
      direction: props.direction,
    });

    if (
      target.id.replace("add_", "") === props.block_id ||
      target.id.replace("block_", "") === props.block_id
    ) {
      return;
    }

    if (
      target.classList.contains("block") &&
      props.storeManager.script.blocks.hasRoleId({
        block_id: target.id.replace("block_", ""),
        role_id: props.role_id,
      })
    ) {
      console.log("add connection!", target.id.replace("block_", ""));
      props.storeManager.script.blocks.addConnection({
        block_id: props.block_id,
        connecting_block_id: target.id.replace("block_", ""),
        role_id: props.role_id,
        direction: props.direction,
      });
    } else if (target.classList.contains("add_role")) {
      if (
        !props.storeManager.script.blocks.hasRoleId({
          block_id: target.id.replace("add_", ""),
          role_id: props.role_id,
        })
      ) {
        props.storeManager.script.blocks.addRole({
          block_id: target.id.replace("add_", ""),
          role_id: props.role_id,
        });
      }
      //   console.log("ADD THE ROLE!");
      props.storeManager.script.blocks.addConnection({
        block_id: props.block_id,
        connecting_block_id: target.id.replace("add_", ""),
        role_id: props.role_id,
        direction: props.direction,
      });
    }
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
    console.info(
      "necessary reference to props to trigger update",
      role_dom,
      props.instructions
    );
    updateRoleOffset();
  }, [role_dom, props.instructions]);

  onMount(() => {
    updateRoleOffset();
    setTimeout(updateRoleOffset, 250);
  });
  /*   createEffect(() => {
    console.log("INSTRUCTIONS ARE UPDATED, FROM ROLE", props.instructions);
  }, [props.instructions]); */

  const removeRole = async (e) => {};

  const convertRole = async () => {
    let remaining_roles = { ...props.roles };
    delete remaining_roles[props.role_id];

    let option_array = Object.entries(remaining_roles).map(
      ([role_id, role]) => {
        console.log("HUE IS ", props.all_roles[role_id]);
        return {
          value: role_id,
          background: `hsl(${props.all_roles[role_id].hue}, 100%, 50%)`,
          color: "white",
        };
      }
    );

    if (Object.keys(remaining_roles).length === 0) return;

    let target_role_id = await props.storeManager.editor.openOverlay({
      type: "options",
      data: {
        text: (
          <>
            <div>
              convert role
              <span
                className="role_id"
                style={{ background: `hsl(${props.role_hue}, 100%, 50%)` }}
              >
                {props.role_id}
              </span>
            </div>
            <div>and its associated instructions</div>
            <div>
              from <span className="selected_blocks">selected block</span> into:
            </div>
          </>
        ),
        options: option_array,
      },
    });

    if (!!!target_role_id) return;

    console.log(target_role_id);

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

    let result = await props.storeManager.editor.openOverlay({
      type: "options",
      data: {
        text: (
          <>
            <div>
              remove or convert role{" "}
              <span
                className="role_id"
                style={{ background: `hsl(${props.role_hue}, 100%, 50%)` }}
              >
                {props.role_id}
              </span>
            </div>
            <div>and its associated instructions</div>
            <div>
              {" "}
              from <span className="selected_blocks">selected block</span>
            </div>
          </>
        ),
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

    /*     let result = await props.storeManager.editor.openOverlay({
      type: "confirm",
      data: {
        text: `remove role ${role_id} from block?`,
        position: { x: e.clientX, y: e.clientY },
      },
    });

    if (!result) return;

    props.storeManager.script.blocks.removeRole({
      block: props.block,
      role_id,
    }); */
  };

  const getClassName = () => {
    return `role ${props.direction}_${props.block_id}_${props.role_id} ${props.hasError}`;
  };

  return (
    <span className="flexing role-container">
      <span
        style={{ "background-color": `hsl(${props.role_hue}, 100%, 50%)` }}
        ref={role_dom}
        onPointerDown={(e) => {
          startConnection(e, props.role_id);
        }}
        onContextMenu={(e) => {
          removeOrConvertRole(e, props.role_id);
        }}
        className={getClassName()}
      >
        {props.role_id}
      </span>
    </span>
  );
}
export default Role;
