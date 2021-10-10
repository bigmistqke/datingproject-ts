import { createMemo, For, createEffect } from "solid-js";

import cursorEventHandler from "../helpers/cursorEventHandler";
import "./Roles.css";
import Role from "./Role.jsx";

const Roles = (props) => {
  const ordered_roles = createMemo(
    () =>
      props.roles
        ? [...props.roles].sort(
            (a, b) => parseInt(a.role_id) - parseInt(b.role_id)
          )
        : null,
    [props.roles]
  );

  const role_positions = createMemo(
    () => ordered_roles().map((v) => v),
    [ordered_roles]
  );

  const addRoleMaybe = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    let role_values = !Object.values(props.block.roles);
    let remaining_roles = props.all_roles.filter((role) =>
      role_values.find((role) => role.role_id === role.role_id)
    );
    if (remaining_roles.length === 0) return;

    let role_id = await this.openOverlay({
      type: "role",
      data: { block: props.block, roles: remaining_roles },
    });
    if (!role_id) return;

    props.storeManager.blocks.addRole({
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
            <For each={ordered_roles()}>
              {(role, i) => {
                return (
                  <Role
                    role_id={role.role_id}
                    block_id={props.block_id}
                    direction={props.direction}
                    hasError={checkErrors(role.role_id)}
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
        {!props.roles || props.block.roles.length != props.roles.length ? (
          <button onClick={addRoleMaybe}>add role</button>
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
