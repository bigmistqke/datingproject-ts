import { onMount, For } from "solid-js";

import "./Overlay.css";

const OverlayTypes = {
  addRole: (props) => (
    <>
      <header>add role to block</header>
      <div className="flex">
        <For each={Object.entries(props.data.roles)}>
          {([role_id, role]) => (
            <span className={"flexing"}>
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  props.resolve(role_id);
                }}
                style={{
                  background: `hsl(${role.hue}, 100%, 65%)`,
                  color: "white",
                }}
                className="role_id"
              >
                {role_id}
              </button>
            </span>
          )}
        </For>
      </div>
    </>
  ),
  confirm: (props) => (
    <>
      <header>{props.data.text}</header>
      <button
        onMouseDown={(e) => {
          e.stopPropagation();
          props.resolve(true);
        }}
      >
        confirm
      </button>
    </>
  ),
  options: (props) => (
    <>
      <header>{props.data.text}</header>
      <div className="flex">
        <For each={props.data.options}>
          {(option) => (
            <span className="flexing">
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  props.resolve(option.value ? option.value : option);
                }}
                style={{
                  background: option.background ? option.background : "white",
                  color: option.color ? option.color : "black",
                }}
              >
                {option.value ? option.value : option}
              </button>
            </span>
          )}
        </For>
      </div>
    </>
  ),
  option_groups: (props) => (
    <>
      <header>{props.data.title}</header>
      <div className="group_container">
        {Object.entries(props.data.options).map(([title, options]) => (
          <div key={title} className="group">
            <header className="group_title">{title}</header>
            <div>
              {options.map((option) => (
                <button
                  key={title + option}
                  onMouseDown={() => {
                    props.resolve({ title, option });
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  ),
};
function Overlay(props) {
  onMount(() => {
    console.log("MOUNT OVERLAY!!");
  });

  const closeOverlay = (e) => {
    if (!e.target.classList.contains("overlay-container")) return;
    console.log(props);
    props.resolve(false);
    props.closeOverlay();
  };

  return (
    <div className="overlay-container" onMouseDown={closeOverlay}>
      <div
        style={{
          left: `${parseInt(props.position.x)}px`,
          top: `${parseInt(props.position.y)}px`,
        }}
        className="overlay "
      >
        {OverlayTypes[props.type](props)}
      </div>
    </div>
  );
}

export default Overlay;
