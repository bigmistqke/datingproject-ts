import { SelectionBox } from '../managers/types'

function SelectionBox(props: { data: SelectionBox }) {
  return (
    <div
      class="selectionBox"
      style={{
        top: props.data.top + 'px',
        left: props.data.left + 'px',
        width: props.data.width + 'px',
        height: props.data.height + 'px',
      }}
    ></div>
  )
}

export default SelectionBox
