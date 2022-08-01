import s from "./Input.module.css";
export default (props) => (
  <input
    type="text"
    {...props}
    classList={{
      [s.input]: true,
      ...props.classList,
    }}
  />
);
