import { For, Show } from 'solid-js'
import { useStore } from '../managers/Store'
import Instruction from './Instruction'

import type { State, Node } from '../managers/types'

export default (props: {
  in_outs: {}
  node_id: string
  node: Node
  isVisible: boolean
  instructions: string[]
  state: State
  updateNodeDimensions: () => void
}) => {
  const [state, actions] = useStore()

  const addRow = () => {
    let { instruction_id } = actions.addInstruction({
      role_id: Object.keys(props.in_outs)[0],
    })
    actions.addInstructionIdToNode({
      node_id: props.node_id,
      instruction_id: instruction_id,
      prev_instruction_id: props.instruction_id,
      index: 0,
    })
  }

  return (
    <div
      style={{
        'pointer-events': props.isVisible ? 'all' : 'none',
        flex: 1,
      }}
    >
      <div
        style={{
          visibility: props.isVisible ? undefined : 'hidden',
        }}
      >
        <Show when={props.instructions.length === 0}>
          <button onClick={addRow}>add new row</button>
        </Show>
        <For each={props.instructions}>
          {(instruction_id, index) => {
            if (!(instruction_id in props.state.script.instructions)) {
              console.error(
                `node contains instruction_id ${instruction_id} which is not present in props.state.script.instructions`,
              )
              return
            }
            let instruction =
              props.state.script.instructions[instruction_id]

            return (
              <Instruction
                index={index() + 1}
                instruction_id={instruction_id}
                timespan={instruction.timespan}
                text={instruction.text}
                type={instruction.type}
                role_id={instruction.role_id}
                sound={instruction.sound}
                filesize={instruction.filesize}
                node_id={props.node_id}
                role_hue={
                  props.state.script.roles[instruction.role_id]
                    ? props.state.script.roles[instruction.role_id].hue
                    : undefined
                }
                in_outs={props.in_outs}
                updateNodeDimensions={props.updateNodeDimensions}
              />
            )
          }}
        </For>
      </div>
    </div>
  )
}
