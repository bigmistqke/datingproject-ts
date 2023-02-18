import './Select.css'
import { createSignal, For, createMemo, createEffect, JSX } from 'solid-js'

function Select(props: {
  options: any[]
  value: any
  onInput: (value: any) => void
  class: string
  style: string | JSX.CSSProperties | undefined
}) {
  let [getFocus, setFocus] = createSignal(false)
  let select_dom: HTMLDivElement
  let drop_down_dom: HTMLDivElement

  const getRemainingOptions = createMemo(() => {
    return props.options.filter(option => {
      return option.value !== props.value
    })
  })

  const getSelectedLabel = createMemo(() =>
    props.options.find(option => option.value === props.value)
      ? props.options.find(option => option.value === props.value).label
      : null,
  )

  const closeDropDown = () => setFocus(false)

  const openDropDown = (e: MouseEvent) => {
    e.stopPropagation()
    setFocus(true)

    // TODO: maybe we will need to iterate through offsetParents
    // when there are nested CSS-transformed dom-elements

    let parent_style = window.getComputedStyle(select_dom.offsetParent!)
    let select_style = window.getComputedStyle(select_dom)

    drop_down_dom.style.left =
      select_dom.offsetLeft +
      parseInt(parent_style.marginLeft) -
      parseInt(select_style.marginLeft) +
      'px'

    drop_down_dom.style.top =
      select_dom.offsetTop +
      parseInt(parent_style.marginTop) -
      parseInt(select_style.marginTop) +
      'px'

    let total_width =
      parseInt(select_style.width) +
      parseInt(select_style.marginLeft) +
      parseInt(select_style.marginRight) +
      parseInt(select_style.paddingRight) +
      parseInt(select_style.paddingLeft)

    drop_down_dom.style.width = total_width + 'px'
  }

  const selectValue = (value: any) => {
    closeDropDown()
    props.onInput(value)
  }

  const DropDown = () => {
    return (
      <>
        <div
          classList={{
            focus: getFocus(),
          }}
          class="close-select"
          onMouseDown={closeDropDown}
        ></div>
        <div
          ref={drop_down_dom!}
          classList={{
            drop_down: true,
            focus: getFocus(),
          }}
        >
          <div onMouseUp={closeDropDown}>{getSelectedLabel()}</div>
          <For each={getRemainingOptions()}>
            {option => (
              <div onMouseUp={() => selectValue(option.value)}>
                {option.label}
              </div>
            )}
          </For>
        </div>
      </>
    )
  }

  return (
    <>
      {getFocus() ? <DropDown></DropDown> : null}
      <div
        ref={select_dom!}
        onMouseUp={openDropDown}
        class={props.class}
        classList={{
          select: true,
          focus: getFocus(),
        }}
        style={props.style}
      >
        {getSelectedLabel()}
      </div>
    </>
  )
}

export default Select
