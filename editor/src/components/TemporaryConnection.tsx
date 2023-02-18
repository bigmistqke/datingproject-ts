import { createMemo } from 'solid-js'
import getColorFromHue from '../helpers/getColorFromHue'
import Bezier from './Bezier'

import { useStore } from '../managers/Store'
import { Dimensions, Vector } from '../managers/types'

function TemporaryConnection(props: {
  node_position: Vector
  role_offset: Dimensions & Vector
  direction: string
  next_node_position: Vector
  next_role_offset: Dimensions & Vector
  role_hue: number
}) {
  const [state] = useStore()

  const MARGIN = 10
  const ROLE_HEIGHT = 15

  const getPositionPort = createMemo(() => {
    return {
      x: Math.floor(
        props.node_position.x +
          props.role_offset.width / 2 +
          props.role_offset.x +
          MARGIN,
      ),
      y:
        props.direction === 'in'
          ? Math.floor(
              props.node_position.y + props.role_offset.y + MARGIN,
            )
          : Math.floor(
              props.node_position.y +
                props.role_offset.y +
                ROLE_HEIGHT +
                MARGIN,
            ),
    }
  })

  const getPositionNextPort = createMemo(() => {
    if (!props.next_node_position) return false
    return {
      x: Math.floor(
        props.next_node_position.x +
          props.next_role_offset.width / 2 +
          props.next_role_offset.x +
          MARGIN,
      ),
      y:
        props.direction === 'out'
          ? Math.floor(
              props.next_node_position.y +
                props.next_role_offset.y +
                MARGIN,
            )
          : Math.floor(
              props.next_node_position.y +
                props.next_role_offset.y +
                ROLE_HEIGHT +
                MARGIN,
            ),
    }
  })

  const getPositionCursor = createMemo(() => {
    return {
      x:
        (state.editor.navigation.cursor.x -
          state.editor.navigation.origin.x) /
        state.editor.navigation.zoom,
      y:
        (state.editor.navigation.cursor.y -
          state.editor.navigation.origin.y) /
        state.editor.navigation.zoom,
    }
  }, [state.editor.navigation.cursor, state.editor.navigation.origin])

  const points = createMemo<Vector[]>(() => {
    const next = getPositionNextPort()
    if (next) return [next, getPositionCursor(), getPositionPort()]
    return [(getPositionCursor(), getPositionPort())]
  })

  return (
    <Bezier
      points={points()}
      style={{ stroke: getColorFromHue(props.role_hue) }}
    ></Bezier>
  )
}
export default TemporaryConnection
