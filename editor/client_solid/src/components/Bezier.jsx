import { createEffect, createMemo } from "solid-js";
import { createStore } from "solid-js/store";
function Bezier(props) {
  const PADDING = 150;

  /*   const [state, setState] = createStore({
    boundary: {
      top_left: { x: 0, y: 0 },
      top_bottom: { x: 0, y: 0 },
      width: 0,
      height: 0,
    },
    svg: "",
  }); */

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
      // console.log(point.x);
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
    //console.log("WIDTH IS ", boundary.bottom_right.x - boundary.top_left.x);
    //console.log("height IS ", boundary.bottom_right.y - boundary.top_left.y);

    boundary.width =
      boundary.bottom_right.x - boundary.top_left.x + PADDING * 2;
    boundary.height =
      boundary.bottom_right.y - boundary.top_left.y + PADDING * 2;

    return boundary;
  };

  const getSVG = (points, boundary) => {
    let string = "";
    let point;
    //console.log("POINTS ARE ", boundary.top_left.x);

    points = points.map((point) => {
      //console.log(point);
      return {
        x: point.x - boundary.top_left.x + PADDING,
        y: point.y - boundary.top_left.y + PADDING,
      };
    });
    //console.log(points);
    for (let i = 0; i < points.length - 1; i++) {
      //console.log("POINTS ARE ", points, i);
      // console.log(!points[i + 1].x ? points[i + 1] : "all good");

      let center = {
        x: points[i].x + (points[i + 1].x - points[i].x) / 2,
        y: points[i].y + (points[i + 1].y - points[i].y) / 2,
      };

      //console.log(center);

      if (i === 0) {
        string += "M";
        string += `${points[i].x},${points[i].y} `;
        string += "C";
        string += `${points[i].x},${center.y} `;
        string += `${points[i + 1].x},${center.y} `;
        string += `${points[i + 1].x},${points[i + 1].y} `;
      } else {
        string += "S";
        string += `${points[i].x},${center.y} `;
        string += `${points[i].x},${points.y} `;
      }
    }
    //console.log(string);
    // setState("svg", string);
    return string;
  };

  const state = createMemo(() => {
    let points = props.points.map((point) => {
      return { x: parseInt(point.x), y: parseInt(point.y) };
    });
    let boundary = getBoundary(points);
    let svg = getSVG(points, boundary);
    return { boundary, svg };
  }, [props.points]);

  createEffect(() => {
    // console.log(state());
  }, [state]);

  return (
    <svg
      className="connectionLine"
      width={state().boundary.width}
      height={state().boundary.height}
      style={{
        left: `${state().boundary.top_left.x - PADDING}px`,
        top: `${state().boundary.top_left.y - PADDING}px`,
        position: "absolute",
      }}
    >
      <path style={props.style ? props.style : null} d={state().svg}></path>
    </svg>
  );
}

export default Bezier;
