import s from "./Button.module.css";
export default (props) => (
  <button
    {...props}
    classList={{ [s.button]: true, ...props.classList }}
  ></button>
);
