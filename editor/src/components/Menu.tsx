import TextArea from './TextArea'
import './Menu.css'
import Bubble from './Bubble'
import { createSignal, For, JSX, JSXElement, Show } from 'solid-js'

import { useStore } from '../managers/Store'
import urls from '../urls'
import { Prompt } from '../managers/types'

const MenuHeader = function (props: {
  header: JSXElement | JSXElement[]
  children: JSXElement | JSXElement[]
}) {
  return (
    <header>
      <h1 style={{ 'word-wrap': 'break-word' }}>{props.header}</h1>
      {props.children}
    </header>
  )
}
const MenuBody = function (props: {
  ref?: HTMLDivElement | ((el: HTMLDivElement) => void) | undefined
  children: JSXElement | JSXElement[]
}) {
  return (
    <div ref={props.ref} class="menu-body flex">
      {props.children}
    </div>
  )
}

const MainMenu = function (props: {
  open: any
  description: any
  children?: JSXElement
}) {
  const [state, actions] = useStore()
  const [saveState, setSaveState] = createSignal(0)

  let ref: HTMLButtonElement

  const saveScript = async () => {
    ref.innerHTML = 'saving script...'
    let response = await actions.saveScript()

    setTimeout(() => {
      if (response.ok === 1) {
        ref.innerHTML = 'saved script!'
        setTimeout(() => {
          ref.innerHTML = 'save script'
        }, 2000)
      }
    }, 1000)
  }

  return (
    <div classList={{ main_menu: true, open: props.open }}>
      <MenuHeader header={`editor for 📜 ${state.script.script_id}`}>
        <TextArea
          value={props.description}
          style={{ 'font-style': 'italic' }}
          onChange={() => {
            console.error('not implemented')
          }}
        ></TextArea>
      </MenuHeader>
      <MenuBody>
        <button ref={ref!} class="bubble" onClick={saveScript}>
          save script
        </button>

        <button
          classList={{
            bubble: true,
            selected: state.editor.gui.sub_menu === 'monitor_menu',
          }}
          onClick={() => actions.toggleSubMenu('monitor_menu')}
        >
          {state.editor.gui.sub_menu === 'monitor_menu'
            ? 'close games'
            : 'open games'}
        </button>

        <button
          classList={{
            bubble: true,
            selected: state.editor.gui.sub_menu === 'role_menu',
          }}
          onClick={() => {
            if (state.editor.gui.sub_menu === 'role_menu') {
              actions.toggleSubMenu(false)
            } else {
              actions.toggleSubMenu('role_menu')
            }
          }}
        >
          {state.editor.gui.sub_menu === 'role_menu'
            ? 'close roles'
            : 'open roles'}
        </button>
      </MenuBody>
      {props.children}
    </div>
  )
}

const RoleMenu = function (props: { open: any }) {
  const [state, actions] = useStore()

  let roles_container: HTMLElement
  let views = ['list', 'grid']
  let view_index = 0
  let [getView, setView] = createSignal(views[0])

  const addRole = () => {
    actions.addRoleToScript()
    roles_container.scrollTop = roles_container.scrollHeight
  }

  const removeRole = async (role_id: string) => {
    let role_instructions = Object.entries(
      state.script.instructions,
    ).filter(
      ([instruction_id, instruction]) => instruction.role_id === role_id,
    )
    if (role_instructions.length > 0) {
      let hue = state.script.roles[role_id].hue

      const prompt = {
        type: 'confirm',
        header: (
          <>
            are you sure you want to remove
            <Bubble
              background_hue={hue}
              style={{
                'margin-left': '5px',
                'margin-right': '5px',
              }}
            >
              {role_id}
            </Bubble>
            and all its instructions?
          </>
        ),
      } as Prompt
      let result = await actions.openPrompt(prompt)

      if (!result) return

      actions.removeRoleFromScript(role_id)
    }

    actions.removeRoleFromScript(role_id)
  }

  const toggleView = () => {
    view_index = (view_index + 1) % views.length
    setView(views[view_index % views.length])
  }

  return (
    <div classList={{ role_menu: true, sub_menu: true, open: props.open }}>
      <header>
        <h1 class="flex">
          <span class="flexing">role manager</span>
          <Bubble onClick={toggleView}>{getView()}</Bubble>
          <Bubble color="black">
            # roles: {Object.keys(state.script.roles).length - 1}
          </Bubble>
          <div class="bubble-container">
            <Bubble
              onClick={addRole}
              color="black"
              style={{
                'line-height': '30px',
                'min-width': '30px',
                padding: '0px',
              }}
            >
              +
            </Bubble>
          </div>
        </h1>
      </header>

      <MenuBody ref={roles_container!}>
        {getView() === 'list' ? (
          <For each={Object.entries(state.script.roles)}>
            {([role_id, role]) => (
              <Show when={!role.hidden}>
                <div class="row flex role_row">
                  <div class="bubble-container">
                    <Bubble
                      onChange={name => {
                        actions.setNameRole({ role_id, name })
                      }}
                      contentEditable={true}
                      background_hue={role.hue}
                      color="white"
                      class="role"
                    >
                      {role.name}
                    </Bubble>
                  </div>

                  <input
                    type={'text'}
                    placeholder="add description"
                    onInput={e => {
                      actions.setDescriptionRole({
                        role_id,
                        description: (e.target as HTMLInputElement).value,
                      })
                    }}
                    class="instruction-text flexing"
                    value={role.description}
                  ></input>
                  <div class="bubble-container">
                    <Bubble
                      class="instruction-button "
                      onClick={() => removeRole(role_id)}
                      style={{
                        'line-height': '30px',
                        'min-width': '30px',
                        padding: '0px',
                        transform: 'rotateZ(45deg)',
                      }}
                    >
                      +
                    </Bubble>
                  </div>
                </div>
              </Show>
            )}
          </For>
        ) : (
          <For each={Object.entries(state.script.roles)}>
            {([role_id, role]) => (
              <div class="bubble-container  flexing">
                <Bubble
                  contentEditable={true}
                  background_hue={role.hue}
                  color="white"
                  class="role"
                  style={{
                    'white-space': 'nowrap',
                  }}
                >
                  {role.name}
                </Bubble>
              </div>
            )}
          </For>
        )}
      </MenuBody>
    </div>
  )
}

const GamesMenu = function (props: { open: boolean }) {
  const [state, actions] = useStore()
  return (
    <Show when={props.open}>
      <div
        classList={{
          monitor_menu: true,
          sub_menu: true,
          open: props.open,
        }}
      >
        <header>
          <h1 class="flex">
            <span class="flexing">games manager</span>
            <div class="bubble-container">
              <Bubble onClick={actions.createGame} color="black">
                create game
              </Bubble>
            </div>
          </h1>
        </header>
        <iframe
          src={`${urls.monitor}/${state.script.script_id}/advanced`}
        ></iframe>
      </div>
    </Show>
  )
}

export default function Menu() {
  const [state, actions] = useStore()

  const toggleSubMenu = (type: string) => actions.toggleSubMenu(type)

  return (
    <div class="menu">
      <MainMenu
        description={state.script.description}
        open={state.editor.bools.isMenuOpen}
      />
      <RoleMenu
        open={
          state.editor.gui.sub_menu === 'role_menu' &&
          state.editor.bools.isMenuOpen
        }
      />

      <GamesMenu
        open={
          state.editor.gui.sub_menu === 'monitor_menu' &&
          state.editor.bools.isMenuOpen
        }
      />
    </div>
  )
}
