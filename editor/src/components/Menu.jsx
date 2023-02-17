import TextArea from './TextArea'
import './Menu.css'
import Bubble from './Bubble'
import { createSignal } from 'solid-js'

import { useStore } from '../managers/Store'
import urls from '../urls'

const MenuHeader = function (props) {
  return (
    <header>
      <h1 style={{ 'word-wrap': 'break-word' }}>{props.header}</h1>
      {props.children}
    </header>
  )
}
const MenuBody = function (props) {
  return (
    <div ref={props.ref} className="menu-body flex">
      {props.children}
    </div>
  )
}

const MainMenu = function (props) {
  const [state, actions] = useStore()
  const [saveState, setSaveState] = createSignal(0)

  let ref

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
        <button ref={ref} className="bubble" onClick={saveScript}>
          save script
        </button>

        <button
          classList={{
            bubble: true,
            selected: state.editor.gui.sub_menu === 'monitor_menu',
          }}
          onClick={() => actions.toggleSubMenu('monitor_menu')}
        >
          {state.editor.gui.sub_menu === 'monitor_menu' ? 'close games' : 'open games'}
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
          {state.editor.gui.sub_menu === 'role_menu' ? 'close roles' : 'open roles'}
        </button>

        {/* <button className="bubble" onClick={() => actions.testProcessScript()}>
          process-test
        </button> */}
      </MenuBody>
      {props.children}
    </div>
  )
}

const RoleMenu = function (props) {
  const [state, actions] = useStore()

  let roles_container
  let views = ['list', 'grid']
  let view_index = 0
  let [getView, setView] = createSignal(views[0])

  const addRole = () => {
    actions.addRoleToScript()
    roles_container.scrollTop = roles_container.scrollHeight
  }

  const removeRole = async role_id => {
    let role_instructions = Object.entries(state.script.instructions).filter(
      ([instruction_id, instruction]) => instruction.role_id === role_id,
    )
    if (role_instructions.length > 0) {
      let hue = state.script.roles[role_id].hue.toString()
      let result = await actions.openPrompt({
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
      })

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
        <h1 className="flex">
          <span className="flexing">role manager</span>
          <Bubble onClick={toggleView}>{getView()}</Bubble>
          <Bubble color="black"># roles: {Object.keys(state.script.roles).length - 1}</Bubble>
          <div className="bubble-container">
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

      <MenuBody ref={roles_container}>
        {getView() === 'list' ? (
          <For each={Object.entries(state.script.roles)}>
            {([role_id, role]) => (
              <Show when={!role.hidden}>
                <div className="row flex role_row">
                  <div className="bubble-container">
                    <Bubble
                      onChange={name => {
                        actions.setNameRole({ role_id, name })
                      }}
                      contentEditable={true}
                      background_hue={role.hue}
                      color="white"
                      className="role"
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
                        description: e.target.value,
                      })
                    }}
                    className={`instruction-text flexing`}
                    value={role.description}
                    rows={1}
                  ></input>
                  <div className="bubble-container">
                    <Bubble
                      className="instruction-button "
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
              <div className="bubble-container  flexing">
                <Bubble
                  onChange={name => {
                    changeName({ role_id, name })
                  }}
                  contentEditable={true}
                  background_hue={role.hue}
                  color="white"
                  className="role"
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

const GamesMenu = function (props) {
  const [state, actions] = useStore()
  return (
    <Show when={props.open}>
      <div classList={{ monitor_menu: true, sub_menu: true, open: props.open }}>
        <header>
          <h1 className="flex">
            <span className="flexing">games manager</span>
            <div className="bubble-container">
              <Bubble onClick={actions.createGame} color="black">
                create game
              </Bubble>
            </div>
          </h1>
        </header>
        <iframe src={`${urls.monitor}/${state.script.script_id}/advanced`}></iframe>
      </div>
    </Show>
  )
}

export default function Menu(props) {
  const [state, actions] = useStore()
  // const [sub_menu, setSubMenu] = createSignal(false);

  const toggleSubMenu = type => actions.toggleSubMenu(type)

  return (
    <div class="menu">
      <MainMenu
        description={state.script.description}
        open={state.editor.bools.isMenuOpen}
        toggleSubMenu={toggleSubMenu}
        saveScript={props.saveScript}
      ></MainMenu>
      <RoleMenu
        open={state.editor.gui.sub_menu === 'role_menu' && state.editor.bools.isMenuOpen}
      ></RoleMenu>

      <GamesMenu
        createGame={props.createGame}
        open={state.editor.gui.sub_menu === 'monitor_menu' && state.editor.bools.isMenuOpen}
      ></GamesMenu>
    </div>
  )
}
