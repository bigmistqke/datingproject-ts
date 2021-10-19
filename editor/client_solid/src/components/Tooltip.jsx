import Bubble from "./Bubble";
import "./Tooltip.css";

export default function Tooltip(props) {
  return (
    <Bubble
      className="tooltip"
      style={{
        transform: `translate(${props.cursor.x + 5}px, ${
          props.cursor.y - 20
        }px)`,
      }}
    >
      {props.text}
    </Bubble>
  );
}
