import { Vector } from '../managers/types'

type Box = [Vector, Vector]

// Check if rectangle a contains rectangle b
// Each object (a and b) should have 2 properties to represent the
// top-left corner (x1, y1) and 2 for the bottom-right corner (x2, y2).

function contains(a: Box, b: Box) {
  return !(
    b[0].x < a[0].x ||
    b[0].y < a[0].y ||
    b[1].x > a[1].x ||
    b[1].y > a[1].y
  )
}

// Check if rectangle a overlaps rectangle b
// Each object (a and b) should have 2 properties to represent the
// top-left corner (x1, y1) and 2 for the bottom-right corner (x2, y2).
function overlaps(a: Box, b: Box) {
  // no horizontal overlap
  if (a[0].x >= b[1].x || b[0].x >= a[1].x) return false

  // no vertical overlap
  if (a[0].y >= b[1].y || b[0].y >= a[1].y) return false

  return true
}

// Check if rectangle a touches rectangle b
// Each object (a and b) should have 2 properties to represent the
// top-left corner (x1, y1) and 2 for the bottom-right corner (x2, y2).
function touches(a: Box, b: Box) {
  // has horizontal gap
  if (a[0].x > b[1].x || b[0].x > a[1].x) return false

  // has vertical gap
  if (a[0].y > b[1].y || b[0].y > a[1].y) return false

  return true
}

export { contains, overlaps, touches }
