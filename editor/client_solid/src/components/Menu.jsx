import TextArea from "./TextArea";

export default function Menu(props) {
  return (
    <div classList={{ menu: true, open: props.editorState.bools.isMenuOpened }}>
      <header>
        <h1 className="flexing">editor for 📜 {props.script_id} </h1>
        <TextArea
          //   storeManager={props.storeManager}
          value={props.scriptState.description}
          style={{ "font-style": "italic" }}
          onChange={() => {
            console.error("not implemented");
          }}
        ></TextArea>
      </header>

      <div className="menu-body">
        <button
          className="bubble flexing"
          onClick={() => {
            console.error("not yet implemented");
          }}
        >
          play
        </button>

        <button
          className="bubble flexing"
          onClick={() => {
            console.error("not yet implemented");
          }}
        >
          save
        </button>
        <button
          className="bubble role-amount"
          onClick={() => {
            props.storeManager.editor.toggleGui("role_admin");
          }}
        >
          {props.editorState.gui.role_admin ? "close roles" : "open roles"}
        </button>
      </div>
    </div>
  );
}
