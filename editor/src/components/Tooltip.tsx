import { useStore } from '../managers/Store'
import { styled } from 'solid-styled-components'

export default function Tooltip() {
  const [state] = useStore()

  const Tooltip = styled('span')`
    padding-top: 2px;
    padding-bottom: 1px;
    border-radius: 50px;
    display: inline-block;
    text-align: center;
    justify-content: center;
    outline: none;
    vertical-align: middle;
    position: absolute;
    z-index: 50;
    background: white;
    color: var(--dark);
    box-shadow: var(--dark-shadow);
    font-size: 8pt;
    padding-left: 10px;
    padding-right: 10px;
  `

  return (
    <Tooltip
      style={{
        transform: `translate(${state.editor.navigation.cursor.x + 5}px, ${
          state.editor.navigation.cursor.y - 20
        }px)`,
      }}
    >
      {state.editor.gui.tooltip}
    </Tooltip>
  )
}
