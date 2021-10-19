import { onMount, For, createSignal } from "solid-js";
import getColorFromHue from "../helpers/getColorFromHue";

import getRandomHue from "../helpers/getRandomHue";

import Overlay from "./Overlay";
import Bubble from "./Bubble";

const PromptTypes = {
  addRole: (props) => (
    <For each={Object.entries(props.data.roles)}>
      {([role_id, role]) => (
        <span className={"flexing"}>
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              props.resolve(role_id);
            }}
            style={{
              background: getColorFromHue(role.hue),
              color: "white",
            }}
            className="role_id"
          >
            {role.name}
          </button>
        </span>
      )}
    </For>
  ),
  confirm: (props) => (
    <>
      <div className="flexing">
        <Bubble
          onClick={() => {
            props.resolve(true);
          }}
          background_hue={getRandomHue(0)}
        >
          confirm
        </Bubble>
      </div>
      <div className="flexing">
        <Bubble
          onClick={() => {
            props.resolve(false);
          }}
          background_hue={getRandomHue(1)}
        >
          cancel
        </Bubble>
      </div>
    </>
  ),
  options: (props) => (
    <For each={props.data.options}>
      {(option, index) => {
        return (
          <div className="flexing">
            <Bubble
              onClick={(e) => {
                e.stopPropagation();
                props.resolve(option.value ? option.value : option);
              }}
              style={{
                background: option.background
                  ? option.background
                  : getColorFromHue(getRandomHue(index())),
                color: option.color ? option.color : "var(--light-grey)",
              }}
            >
              {option.value ? option.value : option}
            </Bubble>
          </div>
        );
      }}
    </For>
  ),
};
function Prompt(props) {
  let [getPosition, setPosition] = createSignal();

  const closePrompt = () => {
    props.resolve();
    props.closePrompt();
  };

  onMount(() => {
    setPosition({ ...props.position });
  });

  return (
    <Overlay
      position={getPosition()}
      onClose={closePrompt}
      header={props.header}
      style={{ "max-width": props.type === "confirm" ? "250px" : "500px" }}
    >
      {PromptTypes[props.type](props)}
    </Overlay>
  );
}

export default Prompt;
