import { createMemo, For, Match, Show, Switch } from 'solid-js'
import { useStore } from '../managers/Store'
// components
import Role from './Role'
import { Flex, Row } from './UI_Components'
// helpers
import prevOrNext from '../utils/prevOrNext'
// css
import {
  ConnectionDirection,
  InOuts,
  Instruction,
  Node,
} from '../managers/types'
import styles from './InOuts.module.css'

const NodeRoles = (props: {
  in_outs: InOuts
  node: Node
  node_id: string
  errors?: string[]
  direction: ConnectionDirection
  instructions?: Instruction[]
  updateRoleOffset: number
  visible: boolean
}) => {
  const [state, actions] = useStore()

  const addRoleMaybe = async e => {
    e.preventDefault()
    e.stopPropagation()
    console.info('adRoleMaybe')
    let remaining_roles = { ...state.script.roles }

    Object.entries(remaining_roles).forEach(([role_id, role]) => {
      if (role_id in props.in_outs) {
        delete remaining_roles[role_id]
      }
    })
    if (Object.keys(remaining_roles).length === 0) return

    let role_id = await actions.openPrompt({
      type: 'addRole',
      header: 'add role to node',
      data: { node: props.node, roles: remaining_roles },
    })
    if (!role_id) return

    actions.addRoleToNode({
      node_id: props.node_id,
      role_id,
    })
    actions.controlRole(role_id)
  }

  const checkErrors = (role_id: string) => {
    if (
      !!props.errors &&
      props.errors.filter(e => e === role_id).length != 0
    ) {
      return 'error'
    }
    return ''
  }

  const roles = createMemo(() =>
    Object.entries(props.in_outs).sort(([a], [b]) =>
      state.script.roles[a].name > state.script.roles[b].name ? 1 : -1,
    ),
  )

  return (
    <Row class={styles.roles_row}>
      <Show when={props.in_outs}>
        <Flex>
          {
            <For each={roles()}>
              {([role_id, role]) => {
                return (
                  <>
                    <Show when={!role.hidden}>
                      <Role
                        node_id={props.node_id}
                        role_id={role_id}
                        // role={role}
                        connected_node_id={
                          role[prevOrNext(props.direction)]
                        }
                        //
                        role_hue={state.script.roles[role_id].hue}
                        name={state.script.roles[role_id].name}
                        description={
                          state.script.roles[role_id].description
                        }
                        in_outs={props.in_outs}
                        direction={props.direction}
                        hasError={checkErrors(role_id)}
                        instructions={
                          props.direction === 'out'
                            ? props.instructions
                            : null
                        }
                        isVisible={props.isVisible}
                        updateRoleOffset={props.updateRoleOffset}
                        visible={props.visible}
                      />
                    </Show>
                  </>
                )
              }}
            </For>
          }
        </Flex>
        <Switch fallback={<span></span>}>
          <Match
            when={
              Object.keys(props.in_outs).length <
              Object.keys(state.script.roles).length
            }
          >
            <div
              class={styles.add_button}
              id={`add_${props.node_id}`}
              onClick={addRoleMaybe}
            >
              add role
            </div>
          </Match>
        </Switch>
      </Show>
    </Row>
  )
}

export default NodeRoles
