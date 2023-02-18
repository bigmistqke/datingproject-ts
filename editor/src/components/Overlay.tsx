import './Overlay.css'

import { createMemo, JSX, JSXElement, onMount } from 'solid-js'
import { Vector } from '../managers/types'

const Overlay = function (props: {
  onClose: () => void
  style: {}
  position: Vector
  class?: string
  header: JSXElement
  children: JSXElement
}) {
  const closeOverlay = e => {
    if (!e.target.classList.contains('overlay-container')) return
    props.onClose()
  }

  const getStyle = createMemo(() => {
    let style = {}
    if (props.style) {
      style = props.style
    }
    if (typeof props.position === 'object') {
      style = {
        ...style,
        left: `${parseInt(props.position.x)}px`,
        top: `${parseInt(props.position.y)}px`,
      }
    } else {
      if (props.position === 'center') {
        style = {
          ...style,
          left: '50vw',
          top: '50vh',
          transform: 'translate(-50%,-50%)',
        }
      }
    }
    return style
  }, [props.position])

  return (
    <div
      class={`overlay-container ${props.class ? props.class : ''}`}
      onMouseDown={closeOverlay}
    >
      <div style={getStyle()} class="overlay ">
        <header>{props.header}</header>
        <div class="flex overlay-body">{props.children}</div>
      </div>
    </div>
  )
}

export default Overlay
