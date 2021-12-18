import { styled } from "solid-styled-components";

import ArchiveHelper from "../helpers/ArchiveHelper.js";
import { useStore } from "../../store/Store";

import dragHelper from "../../helpers/dragHelper";

export default function Draggable(props) {
  const [state, { archiveStateChanges }] = useStore();

  let div_ref;

  const initTranslation = async function (e) {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    if (props.onPointerDown) props.onPointerDown(e);
    if (props.locked) return;

    let lastTick = performance.now();

    let last_position = { x: e.clientX, y: e.clientY };
    let offset;

    let archive_helper = new ArchiveHelper();

    if (props.onTranslate && !props.shouldNotArchive) {
      archive_helper.init(props.onTranslate({ x: 0, y: 0 }));
    }

    let finished = await dragHelper((e) => {
      if (performance.now() - lastTick < 1000 / 60) return;
      lastTick = performance.now();
      offset = {
        x: (last_position.x - e.clientX) * -1,
        y: (last_position.y - e.clientY) * -1,
      };

      if (props.onTranslate) props.onTranslate(offset);

      last_position = {
        x: e.clientX,
        y: e.clientY,
      };
    });

    if (props.onTranslate && !props.shouldNotArchive) {
      offset = {
        x: (last_position.x - finished.clientX) * -1,
        y: (last_position.y - finished.clientY) * -1,
      };
      let archived_state = archive_helper.update(props.onTranslate(offset));
      if (archiveStateChanges && archive_helper.state_has_changed) {
        archiveStateChanges(archived_state);
      }
    }
    if (props.onPointerUp) props.onPointerUp(e);
  };

  const DIV = styled("div")`
    width: 100%;
    height: 100%;
    display: flex;
    &.locked,
    &.locked * {
      pointer-events: none !important;
    }
  `;

  return (
    <DIV
      id={props.id}
      className={`draggable ${props.locked ? "locked" : ""}`}
      onMouseEnter={props.onMouseEnter}
      onMouseOut={props.onMouseOut}
      onPointerDown={initTranslation}
      onContextMenu={props.onContextMenu}
      ref={div_ref}
      style={{
        position: "absolute",
        left: props.position ? props.position.x + "%" : null,
        top: props.position ? props.position.y + "%" : null,
        "pointer-events": props.children ? "none" : "",
        ...props.style,
      }}
    >
      {props.children}
    </DIV>
  );
}
