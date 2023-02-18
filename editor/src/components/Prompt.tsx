import {
  createSignal,
  For,
  JSX,
  JSXElement,
  onMount,
  Show,
} from 'solid-js'
import getColorFromHue from '../helpers/getColorFromHue'

import getRandomHue from '../helpers/getRandomHue'

import {
  Prompt,
  PromptAddRole,
  PromptConfirm,
  PromptOptions,
  Vector,
} from '../managers/types'
import Bubble from './Bubble'
import Overlay from './Overlay'

const PromptTypes = {
  addRole: (props: PromptAddRole) => (
    <For each={Object.entries(props.data.roles)}>
      {([role_id, role]) =>
        !role.hidden ? (
          <span class={'flexing'}>
            <button
              onMouseDown={e => {
                e.stopPropagation()
                props.resolve(role_id)
              }}
              style={{
                background: getColorFromHue(role.hue),
                color: 'white',
              }}
              class="role_id"
            >
              {role.name}
            </button>
          </span>
        ) : null
      }
    </For>
  ),
  confirm: (props: PromptConfirm) => (
    <>
      <div class="flexing">
        <Bubble
          onClick={() => {
            props.resolve(true)
          }}
          background_hue={getRandomHue(0)}
        >
          confirm
        </Bubble>
      </div>
      <div class="flexing">
        <Bubble
          onClick={() => {
            props.resolve(false)
          }}
          background_hue={getRandomHue(1)}
        >
          cancel
        </Bubble>
      </div>
    </>
  ),
  options: (props: PromptOptions) => (
    <For each={props.data.options}>
      {(option, index) => {
        return (
          <div class="flexing">
            <Bubble
              onClick={e => {
                e.stopPropagation()
                props.resolve(option.value ? option.value : option)
              }}
              style={{
                background: option.background
                  ? option.background
                  : getColorFromHue(getRandomHue(index())),
                color: option.color ? option.color : 'var(--light-grey)',
              }}
            >
              {option.label
                ? option.label
                : option.value
                ? option.value
                : option}
            </Bubble>
          </div>
        )
      }}
    </For>
  ),
}
function Prompt(props: Prompt) {
  const closePrompt = () => {
    props.resolve(false)
  }

  return (
    <Show when={props.position}>
      <Overlay
        position={props.position!}
        onClose={closePrompt}
        header={props.header}
        style={{
          'max-width': props.type === 'confirm' ? '250px' : '500px',
        }}
      >
        {PromptTypes[props.type](props as any)}
      </Overlay>
    </Show>
  )
}

export default Prompt
