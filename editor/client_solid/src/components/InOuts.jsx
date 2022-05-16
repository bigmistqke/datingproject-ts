import { For, Show } from "solid-js";
import { useStore } from "../managers/Store";
// components
import Role from "./Role.jsx";
import { Row, Flex } from "./UI_Components.jsx";
// helpers
import prevOrNext from "../helpers/prevOrNext";
// css
import styles from "./InOuts.module.css";

const NodeRoles = (props) => {
  const [state, actions] = useStore();

  const addRoleMaybe = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.info("adRoleMaybe");
    let remaining_roles = { ...state.script.roles };

    Object.entries(remaining_roles).forEach(([role_id, role]) => {
      if (role_id in props.in_outs) {
        delete remaining_roles[role_id];
      }
    });
    if (Object.keys(remaining_roles).length === 0) return;

    let role_id = await actions.openPrompt({
      type: "addRole",
      header: "add role to node",
      data: { node: props.node, roles: remaining_roles },
    });
    if (!role_id) return;

    actions.addRoleToNode({
      node_id: props.node_id,
      role_id,
    });
    actions.controlRole(role_id);
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
    <Row class={styles.roles_row}>
      <Show when={props.in_outs}>
        <Flex>
          {
            <For
              each={Object.entries(props.in_outs).sort(
                ([a], [b]) =>
                  state.script.roles[a].name > state.script.roles[b].name
              )}
            >
              {([role_id, role]) => {
                return (
                  <Role
                    node_id={props.node_id}
                    role_id={role_id}
                    role={role}
                    connected_node_id={role[prevOrNext(props.direction)]}
                    //
                    role_hue={state.script.roles[role_id].hue}
                    name={state.script.roles[role_id].name}
                    description={state.script.roles[role_id].description}
                    in_outs={props.in_outs}
                    direction={props.direction}
                    hasError={checkErrors(role_id)}
                    instructions={
                      props.direction === "out" ? props.instructions : null
                    }
                    isVisible={props.isVisible}
                    updateRoleOffset={props.updateRoleOffset}
                    visible={props.visible}
                  ></Role>
                );
              }}
            </For>
          }
        </Flex>
        {Object.keys(props.in_outs).length <
        Object.keys(state.script.roles).length ? (
          <div
            class={styles.add_button}
            id={`add_${props.node_id}`}
            onClick={addRoleMaybe}
          >
            add role
          </div>
        ) : (
          <span></span>
        )}
      </Show>
    </Row>
  );
};

export default NodeRoles;
