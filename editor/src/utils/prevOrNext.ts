import { ConnectionDirection } from '../managers/types'

const prevOrNext = (direction: ConnectionDirection) =>
  direction === 'out' ? 'out_node_id' : 'in_node_id'
export default prevOrNext
