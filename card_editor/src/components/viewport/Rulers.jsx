import uniqid from "uniqid";

const Rulers = ({ card_dim, shouldSnap, guides }) => {
  const Ruler = ({ direction }) => {
    const startCursor = (e) => {
      e.preventDefault();
      e.stopPropagation();
      ////

      let id = uniqid();

      let guide = {
        direction: direction,
        position:
          direction === "horizontal"
            ? ((e.clientY - card_dim.y) / card_dim.height) * 100
            : ((e.clientX - card_dim.x) / card_dim.width) * 100,
      };

      guides.update(id, guide);

      const update = (e) => {
        guide.position =
          direction === "horizontal"
            ? ((e.clientY - card_dim.y) / card_dim.height) * 100
            : ((e.clientX - card_dim.x) / card_dim.width) * 100;

        if (shouldSnap) {
          if (Math.abs(guide.position - 50) < 1) {
            guide.position = 50;
            guide.relativePosition = 50;
          }
        }
        guides.update(id, guide);

        // setRender(performance.now());
      };

      const finish = (e) => {
        if (guide.position < 0 || guide.position > 100) {
          guides.delete(id);
        }

        window.removeEventListener("mousemove", update, true);
        window.removeEventListener("mouseup", finish, true);
        // setRender(performance.now());
      };
      window.addEventListener("mousemove", update, true);
      window.addEventListener("mouseup", finish, true);
    };
    return (
      <div className={`ruler ${direction}`} onMouseDown={startCursor}></div>
    );
  };

  return (
    <>
      <Ruler direction="horizontal"></Ruler>
      <Ruler direction="vertical"></Ruler>
    </>
  );
};
export default Rulers;
