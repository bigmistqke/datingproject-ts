import { createMemo, For, createEffect, onMount } from "solid-js";
import "./Role.css";
import cursorEventHandler from "../helpers/cursorEventHandler";
import getColorFromHue from "../helpers/getColorFromHue";

function Role(props) {
  let role_dom;
  const startConnection = async (e, role_id) => {
    if (e.buttons != 1) return;
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
      props.storeManager.script.blocks.addConnection({
        block_id: props.block_id,
        connecting_block_id: target.id.replace("add_", ""),
        role_id: props.role_id,
        direction: props.direction,
      });
    }

    props.storeManager.controlRole(props.role_id);
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
    /* console.info(
      "necessary reference to props to trigger update",
      role_dom,
      props.instructions
    ); */
    updateRoleOffset(role_dom, props.instructions);
  }, [role_dom, props.instructions]);

  onMount(() => {
    updateRoleOffset();
    setTimeout(updateRoleOffset, 250);
  });

  const removeRole = async (e) => {};

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
            <span
              className="role_id"
              style={{ background: getColorFromHue(props.role_hue) }}
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
            <span
              className="role_id"
              style={{ background: getColorFromHue(props.role_hue) }}
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

    /*     let result = await props.storeManager.editor.openPrompt({
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
        style={{ "background-color": getColorFromHue(props.role_hue) }}
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
