import { createEffect } from 'solid-js'
import { createStore } from 'solid-js/store'
import { useStore } from '../managers/Store'
// components
import Bezier from './Bezier'
// helpers
import getColorFromHue from '../helpers/getColorFromHue'
import { Dimensions, Vector } from '../managers/types'

type ConnectionProps = {}

const Connection = (props: {
  in_role_offset: Vector
  out_role_offset: Vector & Dimensions
  out_node_position: Vector
  in_node_position: Vector
  role_hue: any
}) => {
  const MARGIN = 10
  const ROLE_HEIGHT = 12

  let [positions, setPositions] = createStore<{
    prev: Vector
    next: Vector
  }>({
    prev: {
      x: 0,
      y: 0,
    },
    next: {
      x: 0,
      y: 0,
    },
  })

  createEffect(() => {
    if (!props.in_role_offset || !props.out_role_offset) return false
    setPositions('prev', {
      x:
        props.out_node_position.x +
        props.out_role_offset.width / 2 +
        props.out_role_offset.x +
        MARGIN,
      y:
        props.out_node_position.y +
        props.out_role_offset.y +
        ROLE_HEIGHT +
        MARGIN,
    })
  })

  createEffect(() => {
    if (!props.in_role_offset || !props.out_role_offset) return false

    setPositions('next', {
      x:
        props.in_node_position.x +
        props.out_role_offset.width / 2 +
        props.in_role_offset.x +
        MARGIN,
      y: props.in_node_position.y + props.in_role_offset.y + MARGIN,
    })
  })

  return (
    <Bezier
      points={Object.values(positions)}
      style={{ stroke: getColorFromHue(props.role_hue) }}
    />
  )
}

export default Connection
