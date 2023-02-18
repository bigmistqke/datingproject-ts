import { useParams } from 'solid-app-router'
import { For, onMount, Show } from 'solid-js'
import { useStore } from '../managers/Store'

// components
import Bubble from '../components/Bubble'
import Connection from '../components/Connection'
import { dragbox_container } from '../components/DragBox.module.css'
import Errors from '../components/Errors'
import Map from '../components/Map'
import Menu from '../components/Menu'
import Node from '../components/Node.jsx'
import ProgressBars from '../components/ProgressBars'
import Prompt from '../components/Prompt'
import TemporaryConnection from '../components/TemporaryConnection'
import Tooltip from '../components/Tooltip'

// css
import { styled } from 'solid-styled-components'
import styles from './Editor.module.css'

function Editor() {
  const [state, actions] = useStore()

  const { script_id, parent_ids: parent_ids_string } = useParams()
  const parent_ids = parent_ids_string ? parent_ids_string.split('/') : []

  onMount(() => {
    actions.initWindowInteractions()

    actions.setParentIds(parent_ids)

    if (state.script.script_id) return
    actions.setScriptId(script_id)

    actions.fetchGeneralData()
    actions.fetchScript()
  })

  const GRID_SIZE = 1

  const Viewport = styled('div')`
    &.isConnecting .${dragbox_container} > * {
      pointer-events: none !important;
    }
  `

  return (
    <>
      <Show when={state.editor.gui.prompt}>
        <Prompt
          type={state.editor.gui.prompt.type}
          data={state.editor.gui.prompt.data}
          header={state.editor.gui.prompt.header}
          position={
            state.editor.gui.prompt.position
              ? state.editor.gui.prompt.position
              : state.editor.navigation.cursor
          }
          resolve={state.editor.gui.prompt.resolve}
        ></Prompt>
      </Show>
      <Show when={state.editor.gui.tooltip}>
        <Tooltip text={state.editor.gui.tooltip} cursor={state.editor.navigation.cursor}></Tooltip>
      </Show>
      <Errors errors={[].concat.apply([], Object.values(state.editor.errors))}></Errors>
      <Menu />
      <Show when={state.editor.visited_parent_ids.length > 0}>
        <div class={styles.visited_group_ids}>
          <For each={state.editor.visited_parent_ids}>
            {(parent_id, index) => (
              <Bubble
                onClick={() => actions.enterVisitedGroup({ parent_id, index })}
                background_color="grey"
                color="white"
              >
                hallo
              </Bubble>
            )}
          </For>
        </div>
      </Show>
      <Viewport
        classList={{
          [styles.viewport]: true,
          isConnecting: state.editor.bools.isConnecting,
        }}
      >
        <button
          classList={{
            [styles.menu_button]: true,
            [styles.selected]: state.editor.bools.isMenuOpen,
          }}
          onMouseDown={() => actions.setBool('isMenuOpen', bool => !bool)}
        >
          +
        </button>

        <Map>
          <For each={Object.keys(state.script.nodes)}>
            {(node_id, i) => {
              const node = state.script.nodes[node_id]
              return (
                <Show when={node.parent_id === parent_ids[parent_ids.length - 1]}>
                  <Node
                    node={node}
                    node_id={node_id}
                    instructions={node.instructions}
                    in_outs={node.in_outs}
                    dimensions={node.dimensions}
                    visible={node.visible}
                    position={{
                      x: Math.floor(node.position.x / GRID_SIZE) * GRID_SIZE,
                      y: Math.floor(node.position.y / GRID_SIZE) * GRID_SIZE,
                    }}
                  ></Node>
                </Show>
              )
            }}
          </For>

          <For each={state.editor.temporary_connections}>
            {t_c => (
              <TemporaryConnection
                role_hue={state.script.roles[t_c.role_id].hue}
                node_position={state.script.nodes[t_c.node_id].position}
                role_offset={actions.getRoleOffset({
                  node_id: t_c.node_id,
                  role_id: t_c.role_id,
                  direction: t_c.direction,
                })}
                out_node_id={t_c.out_node_id}
                next_node_position={
                  t_c.out_node_id ? state.script.nodes[t_c.out_node_id].position : null
                }
                next_role_offset={
                  t_c.out_node_id
                    ? actions.getRoleOffset({
                        node_id: t_c.out_node_id,
                        role_id: t_c.role_id,
                        direction: t_c.direction,
                      })
                    : null
                }
                direction={t_c.direction}
              ></TemporaryConnection>
            )}
          </For>

          <For
            each={
              Object.values(state.script.nodes) && Object.values(state.script.nodes).length > 0
                ? Object.entries(state.script.nodes)
                : null
            }
          >
            {([node_id, node]) => (
              <Show when={node.parent_id === parent_ids[parent_ids.length - 1] || !node.parent_id}>
                <For each={Object.entries(node.in_outs)}>
                  {([role_id, role]) =>
                    role.out_node_id ? (
                      <Connection
                        out_node_id={role.out_node_id}
                        role_hue={state.script.roles[role_id].hue}
                        out_node_position={node.position}
                        out_role_offset={actions.getRoleOffset({
                          node_id: node_id,
                          role_id,
                          direction: 'out',
                        })}
                        node_id={node_id}
                        role_id={role_id}
                        in_node_position={
                          state.script.nodes[role.out_node_id]
                            ? state.script.nodes[role.out_node_id].position
                            : { x: 0, y: 0 }
                        }
                        in_role_offset={actions.getRoleOffset({
                          node_id: role.out_node_id,
                          role_id,
                          direction: 'in',
                        })}
                      ></Connection>
                    ) : null
                  }
                </For>
              </Show>
            )}
          </For>
          <Show when={state.editor.gui.selectionBox}>
            <div class={styles.selection_box} style={state.editor.gui.selectionBox}></div>
          </Show>
        </Map>
      </Viewport>
      <ProgressBars></ProgressBars>
    </>
  )
}
export default Editor
