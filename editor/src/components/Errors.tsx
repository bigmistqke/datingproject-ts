import { createSignal, For, JSX, JSXElement } from 'solid-js'
import { useStore } from '../managers/Store'
import { Error } from '../managers/types'

import styles from './Errors.module.css'

function Error(props: { node_ids: string | any[]; text: JSXElement }) {
  const [, actions] = useStore()
  const [getCounter, setCounter] = createSignal(0)

  const navigateToNode = () => {
    let node_id = props.node_ids[getCounter() % props.node_ids.length]
    actions.navigateToNodeId(node_id)
    setCounter(getCounter() + 1)
  }

  return (
    <div class={styles.error}>
      <span onMouseDown={navigateToNode}>{props.text}</span>
    </div>
  )
}

const Errors = (props: { errors: Error[] }) => (
  <div class={styles.errors_container}>
    <For each={props.errors}>
      {error => <Error text={error.text} node_ids={error.node_ids} />}
    </For>
  </div>
)

export default Errors
