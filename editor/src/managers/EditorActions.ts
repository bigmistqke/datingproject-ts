import { produce, SetStoreFunction, StoreSetter } from 'solid-js/store'

import reverseDirection from '../utils/reverseDirection'
import { useNavigate } from 'solid-app-router'
import {
  ConnectionDirection,
  Error,
  SelectionBox,
  State,
  Vector,
} from './Store'

export default class EditorActions {
  state: State
  setState: SetStoreFunction<State>
  actions: any
  constructor({
    state,
    setState,
    actions,
  }: {
    state: State
    setState: SetStoreFunction<State>
    actions: any
  }) {
    this.state = state
    this.setState = setState
    this.actions = actions
  }

  navigate = useNavigate()

  //// INTERNALS

  updateErroredNodeIds = () => {
    const node_ids: string[] = []
    Object.values(this.state.editor.errors).forEach(errors => {
      errors.forEach(error => {
        if (!error.node_ids) return
        error.node_ids.forEach(node_id => {
          if (node_ids.indexOf(node_id) !== -1) return
          node_ids.push(node_id)
        })
      })
    })

    this.setState('editor', 'errored_node_ids', node_ids)
  }

  //// PUBLIC FUNCTIONS
  setCursor = (cursor: Vector) =>
    this.setState('editor', 'navigation', 'cursor', cursor)

  getCursor = () => this.state.editor.navigation.cursor

  setSelectionBox = (selection_box: SelectionBox) =>
    this.setState('editor', 'gui', 'selectionBox', selection_box)
  getSelectionBox = () => this.state.editor.gui.selectionBox

  getOrigin = () => this.state.editor.navigation.origin
  getOriginGrid = () => this.state.editor.navigation.origin_grid

  setOrigin = (origin: Vector) => {
    this.setState('editor', 'navigation', 'origin', origin)
    this.updateOriginGrid()
  }

  offsetOrigin = (delta: Vector) => {
    this.setState('editor', 'navigation', 'origin', origin => {
      return {
        x: origin.x + delta.x,
        y: origin.y + delta.y,
      }
    })
    this.updateOriginGrid()
  }

  updateOriginGrid = () => {
    this.setState(
      'editor',
      'navigation',
      'origin_grid',
      0,
      'x',
      Math.floor(
        this.state.editor.navigation.origin.x /
          (this.getZoom() * this.state.editor.navigation.grid_size),
      ) * -1,
    )
    this.setState(
      'editor',
      'navigation',
      'origin_grid',
      0,
      'y',
      Math.floor(
        this.state.editor.navigation.origin.y /
          (this.getZoom() * this.state.editor.navigation.grid_size),
      ) * -1,
    )
    this.setState(
      'editor',
      'navigation',
      'origin_grid',
      1,
      'x',
      Math.floor(
        (this.state.editor.navigation.origin.x * -1 + window.innerWidth) /
          (this.getZoom() * this.state.editor.navigation.grid_size),
      ),
    )
    this.setState(
      'editor',
      'navigation',
      'origin_grid',
      1,
      'y',
      Math.floor(
        (this.state.editor.navigation.origin.y * -1 + window.innerHeight) /
          (this.getZoom() * this.state.editor.navigation.grid_size),
      ),
    )
  }
  getZoom = () => this.state.editor.navigation.zoom

  setErrorsRoleId = ({
    role_id,
    errors,
  }: {
    role_id: string
    errors: Error[]
  }) => {
    this.setState('editor', 'errors', role_id, errors)
    this.updateErroredNodeIds()
  }

  openGui = (type: keyof State['editor']['gui']) =>
    this.setState('editor', 'gui', type, true)
  closeGui = (type: keyof State['editor']['gui']) =>
    this.setState('editor', 'gui', type, false)
  toggleGui = (type: keyof State['editor']['gui']) =>
    this.setState('editor', 'gui', type, (bool: any) => !bool)

  openPrompt = async ({
    type,
    header,
    data,
    position,
  }: {
    type: string
    header: string
    data: string
    position: { x: number; y: number }
    resolve: () => void
  }) =>
    new Promise(r => {
      const resolve = (data: string) => {
        this.setState('editor', 'gui', 'prompt', false)
        r(data)
      }

      this.setState('editor', 'gui', 'prompt', {
        type,
        header,
        data,
        position,
        resolve,
      })
    })

  closePrompt = () => this.setState('editor', 'gui', 'prompt', false)

  setTooltip = (tooltip: string) => {
    this.setState('editor', 'gui', 'tooltip', tooltip)
  }

  closeRoleAdmin = () =>
    this.setState('editor', 'gui', 'role_admin', false)

  // navigation

  calcPositionOffsetZoom = (axis: 'x' | 'y', delta: number) =>
    this.getOrigin()[axis] +
    delta * (this.getOrigin()[axis] - this.getCursor()[axis])

  updateZoomedOut = () => {
    if (this.getZoom() > 0.2) {
      this.setState('editor', 'bools', 'isZoomedOut', false)
    } else {
      this.setState('editor', 'bools', 'isZoomedOut', true)
    }
  }

  private zoom_range = { min: 0.0125, max: 1 }
  limitZoom = (zoom: number) =>
    Math.min(this.zoom_range.max, Math.max(this.zoom_range.min, zoom))

  updateZoomState = (zoom: number, delta: number) => {
    const new_zoom = this.limitZoom(zoom + delta)
    if (new_zoom !== zoom) {
      this.setState('editor', 'navigation', 'origin', origin => ({
        x: this.calcPositionOffsetZoom('x', delta / this.getZoom()),
        y: this.calcPositionOffsetZoom('y', delta / this.getZoom()),
      }))
      this.updateOriginGrid()
      this.updateZoomedOut()
    }
    return new_zoom
  }

  offsetZoom = (delta: number) => {
    this.setState('editor', 'navigation', 'zoom', zoom =>
      this.updateZoomState(zoom, delta),
    )
  }

  zoomIn = () => {
    this.setState('editor', 'navigation', 'zoom', zoom =>
      this.updateZoomState(zoom, zoom * 0.3),
    )
  }

  zoomOut = () => {
    this.setState('editor', 'navigation', 'zoom', zoom =>
      this.updateZoomState(zoom, zoom * -0.3),
    )
  }

  addToSelection = (node_ids: string | string[]) => {
    const n = Array.isArray(node_ids) ? node_ids : [node_ids]
    this.setState('editor', 'selection', selection => [
      ...selection,
      ...n.filter(node_id => selection.indexOf(node_id) === -1),
    ])
  }

  removeFromSelection = (node_ids: string[]) => {
    if (!Array.isArray(node_ids)) node_ids = [node_ids]

    this.setState('editor', 'selection', selection =>
      selection.filter(node_id => node_ids.indexOf(node_id) === -1),
    )
  }

  emptySelection = () => this.setState('editor', 'selection', [])

  emptyRoleOffset = () => this.setState('editor', 'role_offsets', {})

  updateRoleOffset = ({
    node_id,
    role_id,
    direction,
    offset,
  }: {
    node_id: string
    role_id: string
    direction: ConnectionDirection
    offset: Vector
  }) => {
    if (!(node_id in this.state.editor.role_offsets)) {
      this.setState('editor', 'role_offsets', node_id, {})
    }
    if (!(role_id in this.state.editor.role_offsets[node_id])) {
      this.setState('editor', 'role_offsets', node_id, role_id, {})
    }
    this.setState(
      'editor',
      'role_offsets',
      node_id,
      role_id,
      direction,
      offset,
    )
  }

  setConnecting = (bool: boolean) =>
    this.setState('editor', 'bools', 'isConnecting', bool)

  addTemporaryConnection = ({
    node_id,
    role_id,
    out_node_id,
    direction,
    cursor,
  }: {
    node_id: string
    role_id: string
    out_node_id?: string
    direction: ConnectionDirection
    cursor: Vector
  }) => {
    if (out_node_id) {
      this.setState(
        'editor',
        'temporary_connections',
        produce(temporary_connections => {
          temporary_connections.push({
            node_id,
            out_node_id,
            role_id,
            direction: reverseDirection(direction),
            cursor,
          })
        }),
      )
    } else {
      this.setState(
        'editor',
        'temporary_connections',
        produce(temporary_connections => {
          temporary_connections.push({
            node_id,
            role_id,
            direction,
            cursor,
          })
        }),
      )
    }
  }

  removeTemporaryConnection = ({
    node_id,
    role_id,
    direction,
  }: {
    node_id: string
    role_id: string
    direction: ConnectionDirection
  }) => {
    this.setState(
      'editor',
      'temporary_connections',
      temporary_connections =>
        temporary_connections.filter(
          t =>
            !(
              t.node_id === node_id &&
              t.role_id === role_id &&
              t.direction === direction
            ),
        ),
    )
  }

  navigateToNodeId = (node_id: string) => {
    let position = this.state.script.nodes[node_id].position
    this.setState('editor', 'navigation', 'origin', {
      x: position.x * -1 + window.innerWidth / 2 - 900 / 2,
      y: position.y * -1 + 200,
    })

    this.emptySelection()
    this.addToSelection(node_id)
  }

  setBool = (bool_type: keyof State['editor']['bools'], bool: boolean) =>
    this.setState('editor', 'bools', bool_type, bool)

  setSubMenu = (type: State['editor']['gui']['sub_menu']) =>
    this.setState('editor', 'gui', 'sub_menu', type)
  toggleSubMenu = (type: State['editor']['gui']['sub_menu']) => {
    this.setState('editor', 'gui', 'sub_menu', prev =>
      prev !== type ? type : false,
    )
  }

  getRoleOffset = ({
    node_id,
    role_id,
    direction,
  }: {
    node_id: string
    role_id: string
    direction: ConnectionDirection
  }) => {
    return this.state.editor.role_offsets[node_id] &&
      this.state.editor.role_offsets[node_id][role_id] &&
      this.state.editor.role_offsets[node_id][role_id][direction]
      ? this.state.editor.role_offsets[node_id][role_id][direction]
      : null
  }

  enterGroup = (group_id: string) => {
    let parent_id = this.state.script.groups[group_id].parent
    this.setState('editor', 'visited_parent_ids', ids => [
      ...ids,
      group_id,
    ])

    let url = group_id
      ? `/${
          this.state.script.script_id
        }/${this.state.editor.visited_parent_ids.join('/')}`
      : `/${this.state.script.script_id}`

    this.navigate(url)
    this.emptySelection()
    this.emptyRoleOffset()
  }
  enterVisitedGroup = ({
    group_id,
    index,
  }: {
    group_id: string
    index: number
  }) => {
    this.setState('editor', 'visited_parent_ids', ids =>
      ids.slice(0, index),
    )

    let url = group_id
      ? `/${
          this.state.script.script_id
        }/${this.state.editor.visited_parent_ids.join('/')}`
      : `/${this.state.script.script_id}`

    this.navigate(url)
    this.emptySelection()
    this.emptyRoleOffset()
  }

  initWindowInteractions = () => {
    const mousemove = (e: MouseEvent) =>
      this.setCursor({ x: e.clientX, y: e.clientY })

    const keydown = (e: KeyboardEvent) => {
      if (this.state.editor.bools.isCtrlPressed || e.metaKey) {
        switch (e.code) {
          case 'KeyD':
            e.preventDefault()
            this.actions.duplicateSelectedNodes({})
            break
          case 'ArrowUp':
            e.preventDefault()
            this.zoomIn()
            break
          case 'ArrowDown':
            e.preventDefault()
            this.zoomOut()
            break
        }
      } else {
        switch (e.key) {
          case 'Backspace':
            // actions.deleteSelectedNodes();
            break
          case 'Control':
            this.setBool('isCtrlPressed', true)
            break
          case 'Shift':
            this.setBool('isShiftPressed', true)
            break
        }
      }
    }

    const keyup = e => {
      if (this.state.editor.bools.isCtrlPressed && !e.ctrlKey) {
        this.setBool('isCtrlPressed', false)
      }
      if (this.state.editor.bools.isShiftPressed && !e.shiftKey) {
        this.setBool('isShiftPressed', false)
      }
    }

    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('mousemove', mousemove)
  }
}
