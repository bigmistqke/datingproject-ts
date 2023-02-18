import { createMemo, Show } from 'solid-js'
import getColorFromHue from '../utils/getColorFromHue'
import './Instruction.css'
import Select from './Select'

import { styled } from 'solid-styled-components'
import { useStore } from '../managers/Store'
import urls from '../urls'

const Instruction = (props: {
  instruction_id: string
  node_id: string
  role_id: string
  index: number
  type: string
  in_outs: {}
  role_hue?: number
  timespan?: number
  sound?: boolean
  filesize?: number
  text: string
  updateNodeDimensions: () => void
}) => {
  const [state, actions] = useStore()

  const format = (num: number) => num + ' sec'

  const removeRow = () => {
    actions.removeInstruction({
      instruction_id: props.instruction_id,
      node_id: props.node_id,
    })
  }

  const addRow = () => {
    let { instruction_id } = actions.addInstruction({
      role_id: props.role_id,
    })
    actions.addInstructionIdToNode({
      node_id: props.node_id,
      instruction_id: instruction_id,
      prev_instruction_id: props.instruction_id,
      index: props.index,
    })
  }

  const changeType = type => {
    if (type === 'video') {
      actions.setInstruction(props.instruction_id, {
        text: '',
        type,
      })
    } else {
      if (props.type === 'video') {
        actions.setInstruction(props.instruction_id, 'modified', undefined)
        actions.setInstruction(props.instruction_id, 'filesize', undefined)
        actions.setInstruction(props.instruction_id, 'text', '')
      }
      actions.setInstruction(props.instruction_id, {
        type,
      })
    }
  }

  const changeText = e => {
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
    actions.setInstruction(props.instruction_id, {
      text: e.target.value,
    })
  }

  const processVideo = async e => {
    const types = /(\.|\/)(mp4)$/i

    if (!e.target) return

    const file = e.target.files[0]

    if (!types.test(file.type) || !types.test(file.name)) return

    const upload = await actions.processVideo(file, props.instruction_id)

    if (!upload.success) {
      console.error(upload.error)
      return
    }

    actions.setInstruction(props.instruction_id, {
      text: `/api${upload.response.substring(1)}`,
      filesize: file.size,
      modified: new Date().getTime(),
    })
  }

  const Poster = styled('img')`
    height: 150px;
    object-fit: contain;
  `

  const getRoleOptions = createMemo(() =>
    Object.entries(state.script.roles)
      .filter(
        ([role_id, role]) =>
          Object.keys(props.in_outs).indexOf(role_id) != -1,
      )
      .map(([role_id, role]) => ({ label: role.name, value: role_id })),
  )

  return (
    <div
      id={'instruction_' + props.instruction_id}
      classList={{
        row: true,
        flex: true,
        instruction: true,
      }}
    >
      <div
        class="instruction-border"
        style={{ background: getColorFromHue(props.role_hue) }}
      ></div>

      <Select
        options={getRoleOptions()}
        value={props.role_id}
        onInput={value =>
          actions.setInstruction(props.instruction_id, {
            role_id: value,
          })
        }
      />
      <Select
        options={[
          { value: 'do', label: 'do' },
          { value: 'say', label: 'say' },
          { value: 'narrator', label: 'narrator' },
          { value: 'video', label: 'video' },
        ]}
        value={props.type}
        onInput={changeType}
        style={{
          flex: '0 0 60px',
        }}
      />

      <div
        class="timer-container"
        style={{
          flex: '0 0 50px',
        }}
      >
        <input
          type="number"
          onChange={e =>
            actions.setInstruction(props.instruction_id, {
              timespan:
                parseInt((e.target as HTMLInputElement).value) === 0
                  ? undefined
                  : parseInt((e.target as HTMLInputElement).value),
            })
          }
          min={0}
          step={5}
          value={props.timespan ? props.timespan : 0}
          format={format}
          class={!props.timespan ? 'gray' : undefined}
        />
      </div>
      <div
        classList={{
          'timer-sound': true,
          // tiny: true,
          on: props.sound,
        }}
        style={{
          flex: '0 0 45px',
        }}
      >
        <div>
          <label> 🕪 </label>
        </div>
        <div>
          <input
            type="checkbox"
            onChange={e =>
              actions.setInstruction(props.instruction_id, {
                sound: (e.target as HTMLInputElement).checked,
              })
            }
            checked={props.sound}
          ></input>
        </div>
      </div>

      <Show when={props.type === 'video'}>
        <Show when={props.text === ''}>
          <input
            type="file"
            onChange={e => {
              processVideo(e)
            }}
            class="instruction-text flexing"
          ></input>
        </Show>
        <Show when={props.text !== ''}>
          <Poster
            class="flexing"
            src={urls.fetch + props.text.split('.')[0] + '.jpg'}
            onLoad={() => props.updateNodeDimensions()}
          />
        </Show>
      </Show>
      <Show when={props.type !== 'video'}>
        <input
          type={'text'}
          placeholder="enter instruction here"
          onInput={changeText}
          class={`instruction-text flexing`}
          value={props.text}
          rows={1}
        ></input>
      </Show>
      <button class="instruction-button tiny" onClick={() => removeRow()}>
        -
      </button>
      <button class="instruction-button tiny" onClick={() => addRow()}>
        +
      </button>
    </div>
  )
}
export default Instruction
