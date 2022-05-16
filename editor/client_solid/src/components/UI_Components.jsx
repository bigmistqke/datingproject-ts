import styles from "./UI_Components.module.css";

const Row = (props) => (
  <div class={[styles.Row, props.class].join(" ")} {...props} />
);

const Flex = (props) => (
  <div class={[styles.Flex, props.class].join(" ")} {...props} />
);

export { Row, Flex };
