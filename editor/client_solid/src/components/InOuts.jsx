import { For } from "solid-js";
import { styled } from "solid-styled-components";

import { useStore } from "../managers/Store";
import Role from "./Role.jsx";
import { Row, Flex } from "./UI_Components.jsx";

import prevOrNext from "../helpers/prevOrNext";

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

  const AddButon = styled("button")`
    color: white;
    background: transparent !important;
    width: 80px;
    pointer-events: all;
  `;

  const Roles = styled(Row)`
    background: var(--dark-grey);
    pointer-events: none;
  `;

  return (
    // <Row style={{background: `var(--dark-grey)`}}>
    <Roles>
      <Flex>
        {
          <For each={Object.entries(props.in_outs)}>
            {([role_id, role]) => {
              return (
                <Role
                  // role_color={props.all_roles[role.role_id].color}
                  node_id={props.node_id}
                  role_id={role_id}
                  role={role}
                  connected_node_id={role[prevOrNext(props.direction)]}
                  //
                  role_hue={state.script.roles[role_id].hue}
                  name={state.script.roles[role_id].name}
                  description={state.script.roles[role_id].description}
                  // all_roles={props.all_roles}
                  in_outs={props.in_outs}
                  node_id={props.node_id}
                  direction={props.direction}
                  hasError={checkErrors(role_id)}
                  instructions={
                    props.direction === "out" ? props.instructions : null
                  }
                  isVisible={props.isVisible}
                  // isShiftPressed={props.isShiftPressed}
                ></Role>
              );
            }}
          </For>
        }
      </Flex>
      {Object.keys(props.in_outs).length <
      Object.keys(state.script.roles).length ? (
        <AddButon id={`add_${props.node_id}`} onClick={addRoleMaybe}>
          add role
        </AddButon>
      ) : (
        <span></span>
      )}
    </Roles>
    // </Roles>
  );
};

export default NodeRoles;
