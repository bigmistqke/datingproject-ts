import { For, onMount } from "solid-js";

const Guide = (props) => {
  const startCursor = (e) => {
    if (props.areGuidesLocked) return;
    e.preventDefault();
    e.stopPropagation();

    const update = (e) => {
      props.guide.position =
        props.guide.direction === "horizontal"
          ? ((e.clientY - props.card_dimensions.y) /
              props.card_dimensions.height) *
            100
          : ((e.clientX - props.card_dimensions.x) /
              props.card_dimensions.width) *
            100;

      props.guide.position =
        props.shouldSnap && Math.abs(props.guide.position - 50) < 3
          ? 50
          : props.guide.position;

      guides.update(id, guide);
    };

    const finish = (e) => {
      console.log(props.guide.position);
      if (props.guide.position < 0 || props.guide.position > 100) {
        guides.delete(id);
      }
      window.removeEventListener("mousemove", update, true);
      window.removeEventListener("mouseup", finish, true);
    };
    window.addEventListener("mousemove", update, true);
    window.addEventListener("mouseup", finish, true);
  };

  return props.guide.direction === "horizontal" ? (
    <div
      className="guide horizontal"
      onMouseDown={startCursor}
      style={{
        top: props.guide.position + "%",
        left: props.card_dimensions.x * -1,
        pointerEvents: props.areGuidesLocked ? "none" : "auto",
      }}
    ></div>
  ) : (
    <div
      className="guide vertical"
      onMouseDown={startCursor}
      style={{
        left: props.guide.position + "%",
        top: props.card_dimensions.y * -1,
        pointerEvents: props.areGuidesLocked ? "none" : "auto",
      }}
    ></div>
  );
};

const Guides = (props) => {
  onMount(() => {
    console.log({ ...props });
    console.log("guides are", [...props.guides]);
  });
  return (
    <div className="guides">
      {/* <For each={props.guides}>
        {([key, guide]) => (
          <Guide
            card_dimensions={props.card_dimensions}
            guide={guide}
            guides={props.guides}
            shouldSnap={props.shouldSnap}
          ></Guide>
        )}
      </For> */}
    </div>
  );
};

export default Guides;
