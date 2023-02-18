import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  on,
  Show,
  Switch,
} from 'solid-js'
import { useStore } from '../managers/Store'
// components
import Bubble from './Bubble'
import DragBox from './DragBox'
import InOuts from './InOuts'
// helpers
import { overlaps } from '../utils/collisionDetection'
import getColorFromHue from '../utils/getColorFromHue'

import Instructions from './Instructions'

import {
  Dimensions,
  InOuts as InOutsType,
  Prompt,
  Vector,
  Node,
  Instruction,
} from '../managers/types'
import styles from './InOuts.module.css'
import { Row } from './UI_Components'

function Node(props: {
  node_id: string
  visible: boolean
  position: Vector
  role_hue?: number
  instructions: Instruction[]
  dimensions: Dimensions
  node: Node
  in_outs: InOutsType
}) {
  let dom: HTMLDivElement

  const [state, actions, q] = useStore()

  const [isInitialized, setIsInitialized] = createSignal(false)
  const [updateRoleOffset, setUpdateRoleOffset] = createSignal(
    performance.now(),
  )

  const isSelected = createMemo(
    () => state.editor.selection.indexOf(props.node_id) !== -1,
  )

  const isErrored = createMemo(
    () => state.editor.errored_node_ids.indexOf(props.node_id) != -1,
    [state.editor.errored_node_ids],
  )

  const isVisible = createMemo(
    () => props.visible && state.editor.navigation.zoom > 0.125,
  )

  const checkSelectionBox = () => {
    const selection_box = actions.getSelectionBox()

    if (!dom || !selection_box) return

    const collision = overlaps(
      [
        { ...props.position },
        {
          x: props.position.x + dom.offsetWidth,
          y: props.position.y + dom.offsetHeight,
        },
      ],
      [
        {
          x: Math.floor(selection_box.left),
          y: Math.floor(selection_box.top),
        },
        {
          x:
            Math.floor(selection_box.left) +
            Math.floor(selection_box.width),
          y:
            Math.floor(selection_box.top) +
            Math.floor(selection_box.height),
        },
      ],
    )

    if (isSelected() && !collision && !state.editor.bools.isCtrlPressed) {
      actions.removeFromSelection(props.node_id)
    } else if (!isSelected() && collision) {
      actions.addToSelection(props.node_id)
    }
  }

  const updateNodeDimensions = () => {
    actions.setNodeDimensions({
      node_id: props.node_id,
      width: dom.offsetWidth,
      height: dom.offsetHeight,
    })
    setUpdateRoleOffset(performance.now())
  }

  const convertRoles = async () => {
    const all_roles = Object.entries(state.script.roles).map(
      ([role_id, role]) => ({
        value: role_id,
        label: role.name,
        background: getColorFromHue(role.hue),
        color: 'white',
      }),
    )

    const selected_roles = [
      ...new Set(
        state.editor.selection
          .map(node_id => Object.keys(state.script.nodes[node_id].in_outs))
          .reduce((a, b) => a.concat(b), []),
      ),
    ]
      .sort((a, b) =>
        state.script.roles[a].name > state.script.roles[b].name ? 1 : 0,
      )
      .map(role_id => all_roles.find(v => v.value === role_id))

    const position = JSON.parse(
      JSON.stringify(state.editor.navigation.cursor),
    )

    const source_role_id = await actions.openPrompt({
      type: 'options',
      header: 'Select a role to convert',
      data: {
        options: selected_roles,
      },
      position,
    })

    if (!source_role_id) return

    const target_role_id = await actions.openPrompt({
      type: 'options',
      header: (
        <>
          <div>
            convert role
            <Bubble background_hue={props.role_hue}>
              {source_role_id}
            </Bubble>
            into:
          </div>
        </>
      ),
      data: {
        options: all_roles.filter(v => v.value !== source_role_id),
      },
      position,
    })

    if (!target_role_id) return

    actions.convertRole({
      node_ids: state.editor.selection,
      source_role_id,
      target_role_id,
    })
  }

  const contextMenu = async (e: {
    stopPropagation: () => void
    preventDefault: () => void
  }) => {
    e.stopPropagation()
    e.preventDefault()

    actions.addToSelection(props.node_id)

    const result = await actions.openPrompt({
      type: 'options',
      data: { options: ['delete', 'copy', 'merge', 'convert roles'] },
      header:
        state.editor.selection.length == 1
          ? `adjust node`
          : `adjust nodes`,
    })

    switch (result) {
      case 'delete':
        const result = await actions.openPrompt({
          type: 'confirm',
          header: 'are you sure you?',
        } as Prompt)
        if (!result) return
        var { role_ids } = actions.removeSelectedNodes()
        role_ids.forEach(role_id => actions.controlRole(role_id))
        break
      case 'copy':
        actions.duplicateSelectedNodes()
        break
      case 'group':
        actions.groupSelectedNodes()
        break
      case 'merge':
        actions.mergeSelectedNodes()
        break
      case 'convert roles':
        convertRoles()
        break
      default:
        break
    }
  }

  createEffect(() => {
    if (!dom) return
    actions.observe({ dom })
  })

  createEffect(() => {
    if (isVisible() && !isInitialized()) {
      setIsInitialized(true)
      actions.unobserve({ dom })
    }
  })

  createEffect(
    on(
      () => props.instructions.length,
      () => {
        if (!dom) return
        updateNodeDimensions()
      },
    ),
  )

  createEffect(checkSelectionBox)

  return (
    <DragBox
      id={props.node_id}
      onContextMenu={contextMenu}
      position={props.position}
      isSelected={isSelected()}
      isErrored={isErrored()}
      ref={dom!}
      style={{
        height:
          isInitialized() || !props.dimensions
            ? ''
            : props.dimensions.height + 'px',
      }}
    >
      <div
        style={{
          display: 'flex',
          'flex-direction': 'column',
          height: '100%',
        }}
      >
        <InOuts
          node_id={props.node_id}
          node={props.node}
          in_outs={props.in_outs}
          direction="in"
          updateRoleOffset={updateRoleOffset()}
          visible={props.visible}
        />

        <Switch
          fallback={
            <Row
              class={styles.roles_row}
              style={{
                'align-content': 'center',
                'align-items': 'center',
                'flex-direction': 'column',
              }}
            >
              <Bubble style={{ color: 'black', background: 'white' }}>
                {props.node.type?.toUpperCase()}
              </Bubble>
            </Row>
          }
        >
          <Match
            when={!props.node.type || props.node.type === 'instruction'}
          >
            <Instructions
              instructions={props.instructions}
              isVisible={isVisible()}
              state={state}
              updateNodeDimensions={updateNodeDimensions}
              node_id={props.node_id}
              node={props.node}
              in_outs={props.in_outs}
            />
          </Match>
        </Switch>

        <Show when={props.node.type === 'group'}>
          <div style={{ 'text-align': 'center', padding: '6px' }}>
            <Bubble
              onClick={() => actions.enterGroup(props.node.group_id)}
              background_color="var(--dark-grey)"
              color="black"
            >
              open group
            </Bubble>
          </div>
        </Show>
        <InOuts
          node_id={props.node_id}
          node={props.node}
          in_outs={props.in_outs}
          visible={props.visible}
          instructions={props.instructions}
          direction="out"
          updateRoleOffset={updateRoleOffset()}
        />
      </div>
    </DragBox>
  )
}

export default Node
