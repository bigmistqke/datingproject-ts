import { For, Match, Switch } from 'solid-js'
import { styled } from 'solid-styled-components'

import { useStore } from '../managers/Store'
import Role from './Role'
import { Flex, Row } from './UI_Components'

import prevOrNext from '../helpers/prevOrNext'
import {
  ConnectionDirection,
  Error,
  InOuts,
  Instruction,
  Node,
} from '../managers/types'

const NodeRoles = (props: {
  in_outs: InOuts
  node: Node
  node_id: string
  errors: Error
  direction: ConnectionDirection
  instructions: Instruction[]
  visible: boolean
}) => {
  const [state, actions] = useStore()

  const addRoleMaybe = async e => {
    e.preventDefault()
    e.stopPropagation()

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

  const checkErrors = role_id => {
    if (
      !!props.errors &&
      props.errors.filter(e => e === role_id).length != 0
    ) {
      return 'error'
    }
    return ''
  }

  const AddButon = styled('button')`
    color: white;
    pointer-events: all;
    background: transparent !important;
    width: 80px;
  `

  const Roles = styled('div')`
    pointer-events: none;
    background: var(--dark-grey);
  `

  return (
    <Roles>
      <Row>
        <Flex>
          {
            <For each={Object.entries(props.in_outs)}>
              {([role_id, in_out]) => {
                return (
                  <Role
                    node_id={props.node_id}
                    role_id={role_id}
                    role_hue={state.script.roles[role_id].hue}
                    name={state.script.roles[role_id].name}
                    description={state.script.roles[role_id].description}
                    in_outs={props.in_outs}
                    direction={props.direction}
                    hasError={checkErrors(role_id)}
                    instructions={
                      props.direction === 'out' ? props.instructions : null
                    }
                    visible={props.visible}
                  ></Role>
                )
              }}
            </For>
          }
        </Flex>

        <Switch>
          <Match
            when={
              Object.keys(props.in_outs).length <
              Object.keys(state.script.roles).length - 1
            }
          >
            <AddButon id={`add_${props.node_id}`} onClick={addRoleMaybe}>
              add role halo
            </AddButon>
          </Match>
        </Switch>
      </Row>
    </Roles>
  )
}

export default NodeRoles
