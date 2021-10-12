import DragBox from "./DragBox";
import getColorFromHue from "../helpers/getColorFromHue";
import { For, onMount, createSignal } from "solid-js";

import Bubble from "./Bubble";
import "./RoleAdmin.css";

export default function RoleAdmin(props) {
  let roles_container;
  const [getPosition, setPosition] = createSignal({
    x: window.innerWidth / 2,
    y: 50,
  });
  const [getSelected, setSelected] = createSignal(false);

  onMount(() => {
    console.log(props.scriptState.roles);
  });
  const closeRoleAdmin = () => {
    props.storeManager.editor.closeGui("role_admin");
  };

  const addRole = () => {
    props.storeManager.script.roles.add();
    roles_container.scrollTop = roles_container.scrollHeight;
  };

  const translate = (offset) => {
    setPosition({
      x: getPosition().x + offset.x,
      y: getPosition().y + offset.y,
    });
  };

  const removeRole = async (role_id) => {
    let role_instructions = Object.entries(
      props.scriptState.instructions
    ).filter(
      ([instruction_id, instruction]) => instruction.role_id === role_id
    );
    if (role_instructions.length > 0) {
      let result = await props.storeManager.editor.openPrompt({
        type: "confirm",
        header: (
          <>
            are you sure you want to remove
            <Bubble
              background_hue={props.scriptState.roles[role_id].hue}
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

      props.storeManager.script.roles.remove(role_id);

      console.log(result);
    }

    // props.storeManager.script.roles.remove(role_id);
  };

  const setDescription = ({ role_id, description }) => {
    props.storeManager.script.roles.setDescription({ role_id, description });
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
      style={{ "z-index": 50, transform: "translateX(-50%)" }}
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
          {([role_id, role]) => {
            console.log("role.hue", role.hue);
            return (
              <div className="row flex role_row">
                <div style={{ "text-align": "center" }}>
                  <Bubble background_hue={role.hue}>{role_id}</Bubble>
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
            );
          }}
        </For>
      </div>
    </DragBox>
  );
}
