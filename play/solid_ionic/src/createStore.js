export default function createStore([state, setState]) {
  let ref = state;

  const set = function () {
    const args = Array.from(arguments);

    const nestedObject = args.slice(0, -2).reduce(
      (object, part) => {
        if (object === undefined) return undefined;
        if (typeof part === "function") {
          return object.find((i) => part(i));
        }
        return object[part];
      },
      ref
    );

    if (nestedObject !== undefined) {
      const [part] = args.slice(-2);
      const [value] = args.slice(-1);
      if (typeof part === "function") {
        let part_index = nestedObject.findIndex((i) => part(i));
        if (typeof value === "function") {
          nestedObject[part_index] = value(nestedObject[part_index]);
        } else {
          nestedObject[part_index] = value;
        }
      } else {
        if (typeof value === "function") {
          nestedObject[part] = value(nestedObject[part]);
        } else {
          nestedObject[part] = value;
        }
      }
    }
    setState({ ...ref });
  };
  return [state, set, ref];
};