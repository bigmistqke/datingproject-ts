import Bubble from "./Bubble";
import "./Tooltip.css";

import { useStore } from "../managers/Store";

export default function Tooltip(props) {
  const [state] = useStore();
  return (
    <Bubble
      className="tooltip"
      style={{
        transform: `translate(${state.editor.navigation.cursor.x + 5}px, ${
          state.editor.navigation.cursor.y - 20
        }px)`,
      }}
    >
      {state.editor.gui.tooltip}
    </Bubble>
  );
}
