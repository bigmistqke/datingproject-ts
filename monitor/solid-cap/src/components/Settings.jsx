import s1 from "./Settings.module.css";
import s2 from "./Button.module.css";
import Input from "./Input";
import Button from "./Button";

const Settings = (props) => {
  return (
    <div class={s1.settings}>
      <label>script-id</label>
      <Input
        type="text"
        placeholder="enter your script-id"
        value={props.script_id}
        onChange={(e) => props.setScriptId(e.target.value)}
      />
      <label>modes</label>
      <div class={s1.buttons_container}>
        <Button
          onClick={() => props.setMode("simple")}
          classList={{ [s2.selected]: props.mode === "simple" }}
        >
          simple
        </Button>
        <Button
          onClick={() => props.setMode("advanced")}
          classList={{ [s2.selected]: props.mode === "advanced" }}
        >
          advanced
        </Button>
      </div>
      <label>open monitor</label>
      <Button onClick={props.closeSettings}>open</Button>
    </div>
  );
};

export default Settings;
