import { useStore } from "../managers/Store";
import dragHelper from "../helpers/dragHelper";
import styles from "./DragBox.module.css";

function DragBox(props) {
  const [state, actions] = useStore();

  const initTranslation = async function (e) {
    if (e.button !== 0 || !e.target.classList.contains(styles.handle)) return;

    e.preventDefault();
    e.stopPropagation();

    actions.addToSelection(props.id);

    let last_tick = performance.now();
    let last_position = { x: e.clientX, y: e.clientY };

    await dragHelper((e) => {
      if (performance.now() - last_tick < 1000 / 60) return;

      actions.translateSelectedNodes({
        offset: {
          x: (last_position.x - e.clientX) * -1,
          y: (last_position.y - e.clientY) * -1,
        },
      });

      last_position.x = e.clientX;
      last_position.y = e.clientY;
      last_tick = performance.now();
    });

    if (
      !state.editor.bools.isShiftPressed &&
      state.editor.selection.length === 1
    ) {
      actions.emptySelection();
    }
  };

  return (
    <div
      ref={props.ref}
      id={`drag_${props.id}`}
      classList={{
        [styles.dragbox_container]: true,
        [styles.selected]: props.isSelected,
        [styles.isErrored]: props.isErrored,
      }}
      onPointerDown={initTranslation}
      onContextMenu={props.onContextMenu}
      style={{
        ...props.style,
        left: props.position ? props.position.x + "px" : "",
        top: props.position ? props.position.y + "px" : "",
      }}
    >
      <div class={styles.handle} />
      <div class={styles.children}>{props.children}</div>
    </div>
  );
}

export default DragBox;
