import { createMemo, JSX } from 'solid-js'
import { Vector } from '../managers/types'
// css
import styles from './Bezier.module.css'

type BezierProps = {
  points: Vector[]
  style: JSX.CSSProperties
}

type UndefinedBoundary = {
  top_left: {
    x: undefined | number
    y: undefined | number
  }
  bottom_right: {
    x: undefined | number
    y: undefined | number
  }
  width: undefined | number
  height: undefined | number
}

type Boundary = {
  top_left: {
    x: number
    y: number
  }
  bottom_right: {
    x: number
    y: number
  }
  width: number
  height: number
}

function Bezier(props: BezierProps) {
  const PADDING = 150

  const getBoundary = (points: Vector[]) => {
    let boundary: UndefinedBoundary = {
      top_left: {
        x: undefined,
        y: undefined,
      },
      bottom_right: {
        x: undefined,
        y: undefined,
      },
      width: undefined,
      height: undefined,
    }

    points.forEach(point => {
      if (!boundary.top_left.x || point.x < boundary.top_left.x) {
        boundary.top_left.x = point.x
      }
      if (!boundary.top_left.y || point.y < boundary.top_left.y) {
        boundary.top_left.y = point.y
      }
      if (!boundary.bottom_right.x || point.x > boundary.bottom_right.x) {
        boundary.bottom_right.x = point.x
      }
      if (!boundary.bottom_right.y || point.y > boundary.bottom_right.y) {
        boundary.bottom_right.y = point.y
      }
    })

    boundary.width =
      boundary.bottom_right.x! - boundary.top_left.x! + PADDING * 2
    boundary.height =
      boundary.bottom_right.y! - boundary.top_left.y! + PADDING * 2

    return boundary as Boundary
  }

  const getSVG = (points: Vector[], boundary: Boundary) => {
    let string = ''
    let point
    points = points.map(point => {
      return {
        x: point.x - boundary.top_left.x + PADDING,
        y: point.y - boundary.top_left.y + PADDING,
      }
    })
    for (let i = 0; i < points.length - 1; i++) {
      let center = {
        x: points[i].x + (points[i + 1].x - points[i].x) / 2,
        y: points[i].y + (points[i + 1].y - points[i].y) / 2,
      }
      if (i === 0) {
        string += 'M'
        string += `${points[i].x},${points[i].y} `
        string += 'C'
        string += `${points[i].x},${center.y} `
        string += `${points[i + 1].x},${center.y} `
        string += `${points[i + 1].x},${points[i + 1].y} `
      } else {
        string += 'S'
        string += `${points[i + 1].x},${points[i + 1].y} `
        string += `${points[i + 1].x},${center.y} `
      }
    }
    return string
  }

  const memo = createMemo(() => {
    let points = props.points.map(point => {
      return { x: Math.floor(point.x), y: Math.floor(point.y) }
    })
    let boundary = getBoundary(points)
    let svg = getSVG(points, boundary)
    return { boundary, svg }
  })

  return (
    <svg
      class={styles.bezier}
      width={memo().boundary.width}
      height={memo().boundary.height}
      style={{
        left: `${memo().boundary.top_left.x - PADDING}px`,
        top: `${memo().boundary.top_left.y - PADDING}px`,
        position: 'absolute',
      }}
    >
      <path
        style={props.style ? props.style : undefined}
        d={memo().svg}
      ></path>
    </svg>
  )
}

export default Bezier
