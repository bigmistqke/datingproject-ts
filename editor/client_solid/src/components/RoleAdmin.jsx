import { DragBox } from "./DragBox";
import getColorFromHue from "../helpers/getColorFromHue";
import { For, onMount, createSignal, createEffect } from "solid-js";

import Bubble from "./Bubble";
import "./RoleAdmin.css";

import { useStore } from "../managers/Store";

export default function RoleAdmin(props) {
  const [state, actions] = useStore();

  let roles_container;
  const [getPosition, setPosition] = createSignal({
    x: window.innerWidth / 2,
    y: 50,
  });
  const [getSelected, setSelected] = createSignal(false);

  const closeRoleAdmin = () => {
    actions.closeGui("role_admin");
  };

  const addRole = () => {
    actions.addRoleToScript();
    roles_container.scrollTop = roles_container.scrollHeight;
  };

  const translate = (offset) => {
    setPosition({
      x: getPosition().x + offset.x,
      y: getPosition().y + offset.y,
    });
  };

  const removeRole = async (role_id) => {
    let role_instructions = Object.entries(state.scripts.instructions).filter(
      ([instruction_id, instruction]) => instruction.role_id === role_id
    );
    if (role_instructions.length > 0) {
      let hue = state.scripts.roles[role_id].hue.toString();
      let result = await actions.openPrompt({
        type: "confirm",
        header: (
          <>
            are you sure you want to remove
            <Bubble
              background_hue={hue}
              style={{
                "margin-left": "5px",
                "margin-right": "5px",
              }}
            >
              {role_id}
            </Bubble>
            and all its instructions?
          </>
        ),
      });

      if (!result) return;

      actions.removeRoleFromScript(role_id);
    }

    actions.removeRoleFromScript(role_id);
  };

  const setDescription = ({ role_id, description }) => {
    actions.setDescriptionRole({ role_id, description });
  };

  const changeName = ({ role_id, name }) => {
    actions.setNameRole({ role_id, name });
  };

  return (
    <DragBox
      classList={{ role_admin: true, isSelected: getSelected() }}
      position={getPosition()}
      onTranslate={translate}
      onContextMenu={closeRoleAdmin}
      onPointerDown={() => {
        setSelected(true);
      }}
      onPointerUp={() => {
        setSelected(false);
      }}
      style={{
        "z-index": 50,
        transform: "translateX(-50%)",
        "pointer-events": props.isTranslating ? "none" : "all",
      }}
    >
      <header className=" row flex">
        <h1 className="flex flexing title">Role Editor</h1>
        <span># roles {Object.keys(props.scriptState.roles).length}</span>
        <button className="add_role" onClick={addRole}>
          add role
        </button>
      </header>
      <div className="roles_container" ref={roles_container}>
        <For each={Object.entries(props.scriptState.roles)}>
          {([role_id, role]) => (
            <div className="row flex role_row">
              <div className="bubble-container">
                <Bubble
                  onChange={(name) => {
                    changeName({ role_id, name });
                  }}
                  contentEditable={true}
                  background_hue={role.hue}
                >
                  {role.name}
                </Bubble>
              </div>
              <input
                type={"text"}
                placeholder="add description"
                onInput={(e) => {
                  setDescription({ role_id, description: e.target.value });
                }}
                className={`instruction-text flexing`}
                value={role.description}
                rows={1}
              ></input>
              <button
                className="instruction-button "
                onClick={() => {
                  removeRole(role_id);
                }}
              >
                -
              </button>
            </div>
          )}
        </For>
      </div>
    </DragBox>
  );
}
