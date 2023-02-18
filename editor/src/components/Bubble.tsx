import './Bubble.css'

import { createMemo, createSignal, JSX, onMount } from 'solid-js'
import getColorFromHue from '../utils/getColorFromHue'
import { getCaretPosition, setCaretPosition } from '../utils/CaretPosition'

type BubbleProps = {
  children: JSX.Element | JSX.Element[]
  style?: JSX.CSSProperties
  class?: string
  margin?: number
  color?: string
  background_color?: string
  background_hue?: number
  ref?: HTMLElement
  contentEditable?: boolean
  onChange?: (text: string) => void
  onClick?: (e: MouseEvent) => void
  onMouseEnter?: (e: MouseEvent) => void
  onPointerDown?: (e: PointerEvent) => void
  onPointerUp?: (e: PointerEvent) => void
  onMouseOut?: (e: MouseEvent) => void
  onContextMenu?: (e: MouseEvent) => void
}

export default function Bubble(props: BubbleProps) {
  let [getValueOnFocus, setValueOnFocus] = createSignal('')

  const getStyle = createMemo(() => {
    let style = {}
    if (props.style) style = { ...props.style }
    if (props.margin) style = { ...style, margin: props.margin }
    if (props.color) style = { ...style, color: props.color }
    if (props.background_color)
      style = {
        ...style,
        background: props.background_color,
      }
    if (props.background_hue)
      style = {
        ...style,
        background: getColorFromHue(props.background_hue),
      }
    return style
  })

  const onBlur = () => {
    if (props.ref.innerText === '') {
      props.ref.innerHTML = getValueOnFocus()
    } else {
      props.ref.innerHTML = props.ref.innerText
      if (props.ref.innerText != getValueOnFocus()) {
        if (props.onChange) props.onChange(props.ref.innerText)
      }
    }
  }

  const onKeyUp = () => {
    if (props.onChange) {
      if (props.ref.innerText === '') {
        props.onChange(props.ref.innerText)
      } else {
        let caret_position = getCaretPosition(props.ref)
        props.onChange(props.ref.innerText)
        props.ref.innerHTML = props.ref.innerText
        setCaretPosition(props.ref, caret_position)
      }
    }
  }

  const onFocus = (e: FocusEvent) =>
    setValueOnFocus((e.target as HTMLElement).innerText)

  return props.onClick ? (
    <button
      class={`bubble ${props.class ? props.class : ''}`}
      style={getStyle()}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  ) : (
    <span
      ref={props.ref}
      class={`bubble ${props.class ? props.class : ''}`}
      style={getStyle()}
      onFocus={onFocus}
      onKeyUp={onKeyUp}
      onBlur={onBlur}
      contentEditable={props.contentEditable}
      onMouseEnter={props.onMouseEnter}
      onPointerDown={props.onPointerDown}
      onPointerUp={props.onPointerUp}
      onMouseOut={props.onMouseOut}
      onContextMenu={props.onContextMenu}
    >
      {props.children}
    </span>
  )
}
