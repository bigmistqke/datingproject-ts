import { createMemo, For, createEffect } from "solid-js";

import cursorEventHandler from "../helpers/cursorEventHandler";
import "./Roles.css";
import Role from "./Role.jsx";

const Roles = (props) => {
  /*   const ordered_roles = createMemo(
    () =>
      props.roles
        ? [...props.roles].sort(
            (a, b) => parseInt(a.role_id) - parseInt(b.role_id)
          )
        : null,
    [props.roles, props.all_roles]
  ); */

  /*   const role_positions = createMemo(
    () => ordered_roles().map((v) => v),
    [ordered_roles]
  ); */

  const addRoleMaybe = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    let remaining_roles = { ...props.all_roles };

    Object.entries(remaining_roles).forEach(([role_id, role]) => {
      if (role_id in props.roles) {
        delete remaining_roles[role_id];
      }
    });
    if (Object.keys(remaining_roles).length === 0) return;

    let role_id = await props.storeManager.editor.openPrompt({
      type: "addRole",
      header: "add role to block",
      data: { block: props.block, roles: remaining_roles },
    });
    if (!role_id) return;

    props.storeManager.script.blocks.addRole({
      block_id: props.block_id,
      role_id,
    });
  };

  const checkErrors = (role_id) => {
    if (
      !!props.errors &&
      props.errors.filter((e) => e === role_id).length != 0
    ) {
      return "error";
    }
    return "";
  };

  return (
    <div className="roles">
      <div className="row flex">
        <div className="flex flexing roles-container">
          {
            <For each={Object.entries(props.roles)}>
              {([role_id, role]) => {
                return (
                  <Role
                    // role_color={props.all_roles[role.role_id].color}
                    role_hue={props.all_roles[role_id].hue}
                    role_id={role_id}
                    all_roles={props.all_roles}
                    roles={props.roles}
                    block_id={props.block_id}
                    direction={props.direction}
                    hasError={checkErrors(role_id)}
                    instructions={
                      props.direction === "out" ? props.instructions : null
                    }
                    roles={props.roles}
                    storeManager={props.storeManager}
                  ></Role>
                );
              }}
            </For>
          }
        </div>
        {Object.keys(props.roles).length <
        Object.keys(props.all_roles).length ? (
          <button
            className="add_role"
            id={`add_${props.block_id}`}
            onClick={addRoleMaybe}
          >
            add role
          </button>
        ) : (
          <span></span>
        )}
      </div>
    </div>
  );
};

function rolePropsAreEqual(prev, next) {
  return (
    prev.roles === next.roles &&
    prev.errors === next.errors &&
    prev.roles === next.roles
  );
}

export default Roles;
