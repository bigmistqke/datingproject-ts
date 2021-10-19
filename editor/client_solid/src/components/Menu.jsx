import TextArea from "./TextArea";
import "./Menu.css";
import Bubble from "./Bubble";
import { createSignal } from "solid-js";

const MenuHeader = function (props) {
  return (
    <header>
      <h1>{props.header}</h1>
      {props.children}
    </header>
  );
};
const MenuBody = function (props) {
  return (
    <div ref={props.ref} className="menu-body flex">
      {props.children}
    </div>
  );
};

const MainMenu = function (props) {
  return (
    <div classList={{ main_menu: true, open: props.open }}>
      <MenuHeader header={`editor for 📜 ${props.script_id}`}>
        <TextArea
          value={props.description}
          style={{ "font-style": "italic" }}
          onChange={() => {
            console.error("not implemented");
          }}
        ></TextArea>
      </MenuHeader>
      <MenuBody>
        <button className="bubble" onClick={() => props.saveScript()}>
          save script
        </button>
        <button
          classList={{
            bubble: true,
            selected: props.sub_menu === "monitor_menu",
          }}
          onClick={() => props.toggleSubMenu("monitor_menu")}
        >
          {props.sub_menu === "monitor_menu" ? "close games" : "open games"}
        </button>

        <button
          classList={{
            bubble: true,
            selected: props.sub_menu === "role_menu",
          }}
          onClick={() => {
            if (props.sub_menu === "role_menu") {
              props.toggleSubMenu(false);
            } else {
              props.toggleSubMenu("role_menu");
            }
          }}
        >
          {props.sub_menu === "role_menu" ? "close roles" : "open roles"}
        </button>
      </MenuBody>
      {props.children}
    </div>
  );
};

const RoleMenu = function (props) {
  let roles_container;
  let views = ["list", "grid"];
  let view_index = 0;
  let [getView, setView] = createSignal(views[0]);

  const addRole = () => {
    props.storeManager.script.roles.addRole();
    roles_container.scrollTop = roles_container.scrollHeight;
  };
  const setDescription = ({ role_id, description }) => {
    props.storeManager.script.roles.setDescription({ role_id, description });
  };

  const changeName = ({ role_id, name }) => {
    props.storeManager.script.roles.setName({ role_id, name });
  };

  const removeRole = async (role_id) => {
    let role_instructions = Object.entries(
      props.scriptState.instructions
    ).filter(
      ([instruction_id, instruction]) => instruction.role_id === role_id
    );
    if (role_instructions.length > 0) {
      let hue = props.scriptState.roles[role_id].hue.toString();
      let result = await props.storeManager.editor.openPrompt({
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

      props.storeManager.script.roles.remove(role_id);
    }

    props.storeManager.script.roles.remove(role_id);
  };

  const toggleView = () => {
    view_index = (view_index + 1) % views.length;
    setView(views[view_index % views.length]);
  };

  return (
    <div classList={{ role_menu: true, sub_menu: true, open: props.open }}>
      <header>
        <h1 className="flex">
          <span className="flexing">role manager</span>
          <Bubble onClick={toggleView}>{getView()}</Bubble>
          <Bubble color="black">
            # roles: {Object.keys(props.scriptState.roles).length}
          </Bubble>
          <div className="bubble-container">
            <Bubble
              onClick={addRole}
              color="black"
              style={{
                "line-height": "30px",
                "min-width": "30px",
                padding: "0px",
              }}
            >
              +
            </Bubble>
          </div>
        </h1>
      </header>

      <MenuBody ref={roles_container}>
        {getView() === "list" ? (
          <For each={Object.entries(props.scriptState.roles)}>
            {([role_id, role]) => (
              <>
                <div className="row flex role_row">
                  <div className="bubble-container">
                    <Bubble
                      onChange={(name) => {
                        changeName({ role_id, name });
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
                    type={"text"}
                    placeholder="add description"
                    onInput={(e) => {
                      setDescription({ role_id, description: e.target.value });
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
                        "line-height": "30px",
                        "min-width": "30px",
                        padding: "0px",
                        transform: "rotateZ(45deg)",
                      }}
                    >
                      +
                    </Bubble>
                  </div>
                </div>
              </>
            )}
          </For>
        ) : (
          <For each={Object.entries(props.scriptState.roles)}>
            {([role_id, role]) => (
              <div className="bubble-container  flexing">
                <Bubble
                  onChange={(name) => {
                    changeName({ role_id, name });
                  }}
                  contentEditable={true}
                  background_hue={role.hue}
                  color="white"
                  className="role"
                  style={{
                    "white-space": "nowrap",
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
  );
};

const GamesMenu = function (props) {
  return (
    <div classList={{ monitor_menu: true, sub_menu: true, open: props.open }}>
      <header>
        <h1 className="flex">
          <span className="flexing">games manager</span>
          <div className="bubble-container">
            <Bubble onClick={props.createGame} color="black">
              create game
            </Bubble>
          </div>
        </h1>
      </header>
      <iframe src={`${props.urls.monitor}/${props.script_id}`}></iframe>
    </div>
  );
};

export default function Menu(props) {
  // const [sub_menu, setSubMenu] = createSignal(false);

  const toggleSubMenu = (type) => props.storeManager.editor.toggleSubMenu(type);

  return (
    <div class="menu">
      <MainMenu
        description={props.scriptState.description}
        open={props.editorState.bools.isMenuOpen}
        script_id={props.script_id}
        storeManager={props.storeManager}
        editorState={props.editorState}
        toggleSubMenu={toggleSubMenu}
        sub_menu={props.sub_menu}
        saveScript={props.saveScript}
      ></MainMenu>
      <RoleMenu
        storeManager={props.storeManager}
        scriptState={props.scriptState}
        open={
          props.sub_menu === "role_menu" && props.editorState.bools.isMenuOpen
        }
      ></RoleMenu>
      <GamesMenu
        storeManager={props.storeManager}
        scriptState={props.scriptState}
        urls={props.urls}
        script_id={props.script_id}
        createGame={props.createGame}
        open={
          props.sub_menu === "monitor_menu" &&
          props.editorState.bools.isMenuOpen
        }
      ></GamesMenu>
    </div>
  );
}
