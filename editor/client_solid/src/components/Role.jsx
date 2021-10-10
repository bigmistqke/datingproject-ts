import { createMemo, For, createEffect } from "solid-js";
import "./Roles.css";
function Role(props) {
  let role_dom;
  //   console.log("ROOOOOOOOOOOOOOOOOOOLES");
  const startConnection = async (e, role_id) => {
    console.error("not yet implemented!!!");
    let role_dom = null;
  };

  createEffect(() => {
    // console.log("THIS HAPPENS", role_dom);
    props.storeManager.editor.updateRoleOffset({
      block_id: props.block_id,
      role_id: props.role_id,
      direction: props.direction,
      offset: {
        x: role_dom.offsetLeft,
        y: role_dom.offsetTop,
        width: role_dom.offsetWidth,
      },
    });

    setTimeout(() => {
      props.storeManager.editor.updateRoleOffset({
        block_id: props.block_id,
        role_id: props.role_id,
        direction: props.direction,
        offset: {
          x: role_dom.offsetLeft,
          y: role_dom.offsetTop,
          width: role_dom.offsetWidth,
          height: role_dom.offsetHeight,
        },
      });
    }, 1000);
  }, [role_dom]);

  // const removeRole = async (e, role_id) => {
  //   e.preventDefault();
  //   e.stopPropagation();

  //   let result = await storeManager.editor.openOverlay({
  //     type: "confirm",
  //     data: {
  //       text: `remove role ${role_id} from block?`,
  //       position: { x: e.clientX, y: e.clientY },
  //     },
  //   });

  //   if (!result) return;

  //   props.blockManager.removeRole({
  //     block: props.block,
  //     role_id,
  //   });
  // };

  const getClassName = () => {
    return `role ${props.direction}_${props.block_id}_${props.role_id} ${props.hasError}`;
  };
  console.log("role", props.role_id);

  return (
    <span className="flexing role-container">
      <span
        ref={role_dom}
        onPointerDown={(e) => {
          startConnection(e, props.role_id);
        }}
        onContextMenu={(e) => {
          removeRole(e, props.role_id);
        }}
        className={getClassName()}
      >
        {props.role_id}
      </span>
    </span>
  );
}
export default Role;
