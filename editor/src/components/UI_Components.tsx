import { JSX } from 'solid-js/jsx-runtime'
import styles from './UI_Components.module.css'

const Row = (
  props: JSX.IntrinsicAttributes & JSX.HTMLAttributes<HTMLDivElement>,
) => <div class={[styles.Row, props.class].join(' ')} {...props} />

const Flex = (
  props: JSX.IntrinsicAttributes & JSX.HTMLAttributes<HTMLDivElement>,
) => <div class={[styles.Flex, props.class].join(' ')} {...props} />

export { Row, Flex }
