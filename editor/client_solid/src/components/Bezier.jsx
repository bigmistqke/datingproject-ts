import { createMemo } from "solid-js";
// css
import styles from "./Bezier.module.css";

function Bezier(props) {
  const PADDING = 150;

  const getBoundary = (points) => {
    let boundary = {
      top_left: {
        x: null,
        y: null,
      },
      bottom_right: {
        x: null,
        y: null,
      },
      width: null,
      height: null,
    };

    points.forEach((point) => {
      if (!boundary.top_left.x || point.x < boundary.top_left.x) {
        boundary.top_left.x = point.x;
      }
      if (!boundary.top_left.y || point.y < boundary.top_left.y) {
        boundary.top_left.y = point.y;
      }
      if (!boundary.bottom_right.x || point.x > boundary.bottom_right.x) {
        boundary.bottom_right.x = point.x;
      }
      if (!boundary.bottom_right.y || point.y > boundary.bottom_right.y) {
        boundary.bottom_right.y = point.y;
      }
    });

    boundary.width =
      boundary.bottom_right.x - boundary.top_left.x + PADDING * 2;
    boundary.height =
      boundary.bottom_right.y - boundary.top_left.y + PADDING * 2;

    return boundary;
  };

  const getSVG = (points, boundary) => {
    let string = "";
    let point;
    points = points.map((point) => {
      return {
        x: point.x - boundary.top_left.x + PADDING,
        y: point.y - boundary.top_left.y + PADDING,
      };
    });
    for (let i = 0; i < points.length - 1; i++) {
      let center = {
        x: points[i].x + (points[i + 1].x - points[i].x) / 2,
        y: points[i].y + (points[i + 1].y - points[i].y) / 2,
      };
      if (i === 0) {
        string += "M";
        string += `${points[i].x},${points[i].y} `;
        string += "C";
        string += `${points[i].x},${center.y} `;
        string += `${points[i + 1].x},${center.y} `;
        string += `${points[i + 1].x},${points[i + 1].y} `;
      } else {
        string += "S";
        string += `${points[i + 1].x},${points[i + 1].y} `;
        string += `${points[i + 1].x},${center.y} `;
      }
    }
    return string;
  };

  const memo = createMemo(() => {
    let points = props.points.map((point) => {
      return { x: parseInt(point.x), y: parseInt(point.y) };
    });
    let boundary = getBoundary(points);
    let svg = getSVG(points, boundary);
    return { boundary, svg };
  }, [props.points]);

  return (
    <svg
      className={styles.bezier}
      width={memo().boundary.width}
      height={memo().boundary.height}
      style={{
        left: `${memo().boundary.top_left.x - PADDING}px`,
        top: `${memo().boundary.top_left.y - PADDING}px`,
        position: "absolute",
      }}
    >
      <path style={props.style ? props.style : null} d={memo().svg}></path>
    </svg>
  );
}

export default Bezier;
