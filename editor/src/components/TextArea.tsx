import { JSX, onMount } from 'solid-js'
import { useStore } from '../managers/Store'

function TextArea(props: {
  value: string
  style: string | JSX.CSSProperties | undefined
}) {
  const [state, actions] = useStore()

  let textarea_dom: HTMLTextAreaElement
  onMount(resize)

  function resize() {
    textarea_dom.style.overflow = 'hidden'
    textarea_dom.style.height = '0px'
    textarea_dom.style.height = textarea_dom.scrollHeight + 'px'
  }

  function onInput() {
    resize()
    actions.setDescriptionScript(textarea_dom.value)
  }
  return (
    <textarea
      placeholder="add description"
      ref={textarea_dom!}
      value={props.value}
      onInput={onInput}
      style={props.style ? props.style : undefined}
    ></textarea>
  )
}

export default TextArea
