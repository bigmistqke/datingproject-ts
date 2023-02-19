import { batch, createContext, JSXElement, useContext } from 'solid-js'
import { createStore, produce } from 'solid-js/store'

import Q from 'qquuee'
import { useNavigate } from 'solid-app-router'
import uniqid from 'uniqid'

import clone from '../utils/clone'
import formatText from '../utils/formatText'
import getData from '../utils/getData'
import getRandomHue from '../utils/getRandomHue'
import postData from '../utils/postData'
import prevOrNext from '../utils/prevOrNext'
import { array_insert } from '../utils/pure-array'
import reverseDirection from '../utils/reverseDirection'
import Uploader, { UploaderResponse } from '../utils/Uploader'

import urls from '../urls'

import type {
  Actions,
  ConnectionDirection,
  Group,
  InOuts,
  Node,
  ProcessedNode,
  Prompt,
  Role,
  State,
  UnboxPromise,
} from './types'

import {
  Instruction as ProcessedInstruction,
  InstructionEditor as Instruction,
} from '../../../types'

type Context = [State, Actions, Q]
const StoreContext = createContext<Context>()

type ProviderProps = {
  children: JSXElement | JSXElement[]
}

const mapObject = function <T>(obj: Record<string, T>) {
  return function <U>(callback: (key: string, value: T) => U) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        callback(key, value),
      ]),
    ) as Record<string, U>
  }
}

const arraysMatch = (arr1: any[], arr2: any[]) => {
  if (arr1.length !== arr2.length) return false
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false
  }
  return true
}

export function Provider(props: ProviderProps) {
  const navigate = useNavigate()

  const [state, setState] = createStore<State>({
    script: {
      groups: {},
      nodes: {},
      roles: {},
      instructions: {},
      description: '',
      script_id: undefined,
      design_id: 'europalia3_mikey',
    },
    editor: {
      navigation: {
        cursor: { x: 0, y: 0 },
        origin: { x: 0, y: 0 },
        origin_grid: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        zoom: 1,
        zoomedOut: false,
        grid_size: 2000,
      },
      gui: {
        prompt: false,
        selectionBox: false,
        role_admin: false,
        tooltip: false,
        sub_menu: false,
      },
      bools: {
        isConnecting: false,
        isInitialized: false,
        isShiftPressed: false,
        isCtrlPressed: false,
        isMenuOpen: false,
        isTranslating: false,
        isZoomedOut: false,
      },
      errors: {},
      errored_node_ids: [],
      selection: [],
      role_offsets: {},
      node_dimensions: {},
      temporary_connections: [],
      uploaders: [],
      visited_parent_ids: [],
      parent_ids: [],
    },
  })

  const observer = new IntersectionObserver(
    (entries, observer) => {
      batch(() => {
        entries.forEach(entry => {
          const node_id = entry.target.id.split('_')[1]
          setState(
            'script',
            'nodes',
            node_id,
            'visible',
            entry.isIntersecting,
          )
        })
      })
    },
    {
      rootMargin: '50px',
    },
  )

  const getNextRoleIds = ({
    node,
    index,
  }: {
    node: Node
    index: number
  }) => [state.script.instructions[node.instructions[index + 1]].role_id]

  const getPrevInstructionIds = ({
    node,
    index,
  }: {
    node: Node
    index: number
  }) => [node.instructions[index - 1]]

  const processInstructions = () => {
    try {
      const entries = Object.entries(state.script.nodes)
        .map(([node_id, node]) =>
          node.instructions
            .filter(instruction_id => {
              if (state.script.instructions[instruction_id]) {
                return true
              } else {
                console.error(
                  'instruction_id',
                  instruction_id,
                  'is not present in state.script.instructions',
                  Object.keys(state.script.instructions),
                )
                return false
              }
            })
            .map((instruction_id, index) => {
              if (!state.script.instructions[instruction_id]) {
                throw [
                  'instruction is undefined',
                  instruction_id,
                  state.script.instructions,
                ]
              }
              const instruction = state.script.instructions[instruction_id]

              if (!instruction)
                throw `could not find instruction_id ${instruction_id} in state.script.instructions`

              const processedInstruction = (
                instruction.type !== 'video'
                  ? {
                      ...instruction,
                      text: formatText(instruction.text),
                    }
                  : {
                      ...instruction,
                    }
              ) as ProcessedInstruction

              processedInstruction.timespan = Math.floor(
                instruction.timespan,
              )
              if (instruction.timespan === 0)
                processedInstruction.timespan = undefined

              return [
                instruction_id,
                {
                  ...instruction,
                  prev_instruction_ids:
                    index === 0
                      ? actions.getPrevInstructionIdsOfFirst(node)
                      : getPrevInstructionIds({ node, index }),
                  next_role_ids:
                    index === node.instructions.length - 1
                      ? actions.getNextRoleIdsOfLast(node)
                      : getNextRoleIds({ node, index }),
                },
              ]
            }),
        )
        .flat()
      return Object.fromEntries(entries)
    } catch (err) {
      console.error(`processInstructions : ${err}`)
      return false
    }
  }

  const actions: Actions = {
    // EDITOR
    updateErroredNodeIds: () => {
      const node_ids: string[] = []
      Object.values(state.editor.errors).forEach(errors => {
        errors.forEach(error => {
          if (!error.node_ids) return
          error.node_ids.forEach(node_id => {
            if (node_ids.indexOf(node_id) !== -1) return
            node_ids.push(node_id)
          })
        })
      })

      setState('editor', 'errored_node_ids', node_ids)
    },

    //// PUBLIC FUNCTIONS
    setCursor: cursor =>
      setState('editor', 'navigation', 'cursor', cursor),

    getCursor: () => state.editor.navigation.cursor,

    setSelectionBox: selection_box =>
      setState('editor', 'gui', 'selectionBox', selection_box),
    getSelectionBox: () => state.editor.gui.selectionBox,

    getOrigin: () => state.editor.navigation.origin,
    getOriginGrid: () => state.editor.navigation.origin_grid,

    setOrigin: origin => {
      setState('editor', 'navigation', 'origin', origin)
      actions.updateOriginGrid()
    },

    offsetOrigin: delta => {
      setState('editor', 'navigation', 'origin', origin => {
        return {
          x: origin.x + delta.x,
          y: origin.y + delta.y,
        }
      })
      actions.updateOriginGrid()
    },

    updateOriginGrid: () => {
      setState(
        'editor',
        'navigation',
        'origin_grid',
        0,
        'x',
        Math.floor(
          state.editor.navigation.origin.x /
            (actions.getZoom() * state.editor.navigation.grid_size),
        ) * -1,
      )
      setState(
        'editor',
        'navigation',
        'origin_grid',
        0,
        'y',
        Math.floor(
          state.editor.navigation.origin.y /
            (actions.getZoom() * state.editor.navigation.grid_size),
        ) * -1,
      )
      setState(
        'editor',
        'navigation',
        'origin_grid',
        1,
        'x',
        Math.floor(
          (state.editor.navigation.origin.x * -1 + window.innerWidth) /
            (actions.getZoom() * state.editor.navigation.grid_size),
        ),
      )
      setState(
        'editor',
        'navigation',
        'origin_grid',
        1,
        'y',
        Math.floor(
          (state.editor.navigation.origin.y * -1 + window.innerHeight) /
            (actions.getZoom() * state.editor.navigation.grid_size),
        ),
      )
    },
    getZoom: () => state.editor.navigation.zoom,

    setErrorsRoleId: ({ role_id, errors }) => {
      setState('editor', 'errors', role_id, errors)
      actions.updateErroredNodeIds()
    },

    openGui: type => setState('editor', 'gui', type, true),
    closeGui: type => setState('editor', 'gui', type, false),
    toggleGui: type =>
      setState('editor', 'gui', type, (bool: any) => !bool),

    openPrompt: async ({ type, header, data, position }) =>
      new Promise(r => {
        const resolve = (data: string) => {
          setState('editor', 'gui', 'prompt', false)
          r(data)
        }

        const prompt = {
          type,
          header,
          data,
          position,
          resolve,
        } as Prompt

        setState('editor', 'gui', 'prompt', prompt)
      }),

    closePrompt: () => setState('editor', 'gui', 'prompt', false),

    setTooltip: tooltip => setState('editor', 'gui', 'tooltip', tooltip),

    closeRoleAdmin: () => setState('editor', 'gui', 'role_admin', false),

    // navigation

    calcPositionOffsetZoom: (axis: 'x' | 'y', delta: number) =>
      actions.getOrigin()[axis] +
      delta * (actions.getOrigin()[axis] - actions.getCursor()[axis]),

    updateZoomedOut: () => {
      if (actions.getZoom() > 0.2) {
        setState('editor', 'bools', 'isZoomedOut', false)
      } else {
        setState('editor', 'bools', 'isZoomedOut', true)
      }
    },

    limitZoom: zoom => Math.min(1, Math.max(0.0125, zoom)),

    updateZoomState: (zoom, delta) => {
      const new_zoom = actions.limitZoom(zoom + delta)
      if (new_zoom !== zoom) {
        setState('editor', 'navigation', 'origin', origin => ({
          x: actions.calcPositionOffsetZoom(
            'x',
            delta / actions.getZoom(),
          ),
          y: actions.calcPositionOffsetZoom(
            'y',
            delta / actions.getZoom(),
          ),
        }))
        actions.updateOriginGrid()
        actions.updateZoomedOut()
      }
      return new_zoom
    },

    offsetZoom: delta => {
      setState('editor', 'navigation', 'zoom', zoom =>
        actions.updateZoomState(zoom, delta),
      )
    },

    zoomIn: () => {
      setState('editor', 'navigation', 'zoom', zoom =>
        actions.updateZoomState(zoom, zoom * 0.3),
      )
    },

    zoomOut: () => {
      setState('editor', 'navigation', 'zoom', zoom =>
        actions.updateZoomState(zoom, zoom * -0.3),
      )
    },

    addToSelection: node_ids => {
      const n = Array.isArray(node_ids) ? node_ids : [node_ids]
      setState('editor', 'selection', selection => [
        ...selection,
        ...n.filter(node_id => selection.indexOf(node_id) === -1),
      ])
    },

    removeFromSelection: node_ids => {
      if (!Array.isArray(node_ids)) node_ids = [node_ids]

      setState('editor', 'selection', selection =>
        selection.filter(node_id => node_ids.indexOf(node_id) === -1),
      )
    },

    emptySelection: () => setState('editor', 'selection', []),

    emptyRoleOffset: () => setState('editor', 'role_offsets', {}),

    updateRoleOffset: ({ node_id, role_id, direction, offset }) => {
      if (!(node_id in state.editor.role_offsets)) {
        setState('editor', 'role_offsets', node_id, {})
      }
      if (!(role_id in state.editor.role_offsets[node_id])) {
        setState('editor', 'role_offsets', node_id, role_id, {})
      }
      setState(
        'editor',
        'role_offsets',
        node_id,
        role_id,
        direction,
        offset,
      )
    },

    setConnecting: bool =>
      setState('editor', 'bools', 'isConnecting', bool),

    addTemporaryConnection: ({
      node_id,
      role_id,
      out_node_id,
      direction,
      cursor,
    }) => {
      if (out_node_id) {
        setState(
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
        setState(
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
    },

    removeTemporaryConnection: ({ node_id, role_id, direction }) => {
      setState('editor', 'temporary_connections', temporary_connections =>
        temporary_connections.filter(
          t =>
            !(
              t.node_id === node_id &&
              t.role_id === role_id &&
              t.direction === direction
            ),
        ),
      )
    },

    navigateToNodeId: node_id => {
      const position = state.script.nodes[node_id].position
      setState('editor', 'navigation', 'origin', {
        x: position.x * -1 + window.innerWidth / 2 - 900 / 2,
        y: position.y * -1 + 200,
      })

      actions.emptySelection()
      actions.addToSelection(node_id)
    },

    setBool: (bool_type, bool) =>
      setState('editor', 'bools', bool_type, bool),

    setSubMenu: type => setState('editor', 'gui', 'sub_menu', type),

    toggleSubMenu: type => {
      setState('editor', 'gui', 'sub_menu', prev =>
        prev !== type ? type : false,
      )
    },

    getRoleOffset: ({ node_id, role_id, direction }) => {
      return state.editor.role_offsets[node_id] &&
        state.editor.role_offsets[node_id][role_id] &&
        state.editor.role_offsets[node_id][role_id][direction]
        ? state.editor.role_offsets[node_id][role_id][direction]
        : null
    },

    enterGroup: (group_id: string) => {
      const parent_id = state.script.groups[group_id].parent
      setState('editor', 'visited_parent_ids', ids => [...ids, group_id])

      const url = group_id
        ? `/${
            state.script.script_id
          }/${state.editor.visited_parent_ids.join('/')}`
        : `/${state.script.script_id}`

      navigate(url)
      actions.emptySelection()
      actions.emptyRoleOffset()
    },

    enterVisitedGroup: ({ group_id, index }) => {
      setState('editor', 'visited_parent_ids', ids => ids.slice(0, index))

      const url = group_id
        ? `/${
            state.script.script_id
          }/${state.editor.visited_parent_ids.join('/')}`
        : `/${state.script.script_id}`

      navigate(url)
      actions.emptySelection()
      actions.emptyRoleOffset()
    },

    initWindowInteractions: () => {
      const mousemove = (e: MouseEvent) =>
        actions.setCursor({ x: e.clientX, y: e.clientY })

      const keydown = (e: KeyboardEvent) => {
        if (state.editor.bools.isCtrlPressed || e.metaKey) {
          switch (e.code) {
            case 'KeyD':
              e.preventDefault()
              actions.duplicateSelectedNodes()
              break
            case 'ArrowUp':
              e.preventDefault()
              actions.zoomIn()
              break
            case 'ArrowDown':
              e.preventDefault()
              actions.zoomOut()
              break
          }
        } else {
          switch (e.key) {
            case 'Backspace':
              // actions.deleteSelectedNodes();
              break
            case 'Control':
              actions.setBool('isCtrlPressed', true)
              break
            case 'Shift':
              actions.setBool('isShiftPressed', true)
              break
          }
        }
      }

      const keyup = (e: KeyboardEvent) => {
        if (state.editor.bools.isCtrlPressed && !e.ctrlKey) {
          actions.setBool('isCtrlPressed', false)
        }
        if (state.editor.bools.isShiftPressed && !e.shiftKey) {
          actions.setBool('isShiftPressed', false)
        }
      }

      window.addEventListener('keydown', keydown)
      window.addEventListener('keyup', keyup)
      window.addEventListener('mousemove', mousemove)
    },

    // SCRIPT

    getDefaultInstruction: (role_id: string) => {
      return {
        role_id: role_id,
        type: 'do',
        text: '',
        timespan: 0,
      } as Instruction
    },

    getDefaultNode: () =>
      ({
        type: undefined,
        in_outs: {},
        position: {},
        dimensions: {},
        parent_id:
          state.editor.parent_ids[state.editor.parent_ids.length - 1],
      } as Node),

    getDefaultGroup: () => ({
      description: '',
      in_outs: {} as InOuts,
      parent_id:
        state.editor.parent_ids[state.editor.parent_ids.length - 1],
    }),

    setInstructions: (instructions: Record<string, Instruction>) => {
      setState('script', 'instructions', instructions)
    },

    setRoles: (roles: Record<string, Role>) =>
      setState('script', 'roles', roles),

    setGroups: (groups: Record<string, Group>) =>
      setState('script', 'groups', groups),

    setNodes: (nodes: Record<string, Node>) =>
      setState('script', 'nodes', nodes),

    setScriptId: (script_id: string) =>
      setState('script', 'script_id', script_id),

    setDesignId: (design_id: string) =>
      setState('script', 'design_id', design_id),

    setParentIds: (parent_ids: string[]) =>
      setState('editor', 'parent_ids', parent_ids),

    //

    iterateNodes: nodes => {
      const start = new Date().getTime()
      batch(() => {
        for (let i = 0; i < 50; i++) {
          const n = nodes.shift()
          if (!n) return
          const [node_id, node] = n
          setState('script', 'nodes', node_id, node)
          if (nodes.length === 0) {
            break
          }
        }
      })
      if (nodes.length === 0) return
      setTimeout(() => actions.iterateNodes(nodes), 0)
    },

    //// INSTRUCTIONS

    addInstruction: ({ role_id, instruction, instruction_id }) => {
      if (!instruction)
        instruction = actions.getDefaultInstruction(role_id)
      if (!instruction_id) instruction_id = uniqid()
      setState('script', 'instructions', instruction_id, instruction)
      return { instruction, instruction_id }
    },

    removeInstruction: ({ instruction_id, node_id }) => {
      setState('script', 'nodes', node_id, 'instructions', instructions =>
        instructions.filter(i => i !== instruction_id),
      )
      setState('script', 'instructions', instruction_id, undefined)
    },

    setInstruction: (instruction_id, data) =>
      setState('script', 'instructions', instruction_id, data),

    setFilesize: ({ instruction_id, filesize }) =>
      setState(
        'script',
        'instructions',
        instruction_id,
        'filesize',
        filesize,
      ),

    //// BLOCKS

    /*   const updateNode = (node_id, data) => {
      const node = state.script.nodes[node_id];
      if (!node) return;
  
      Object.keys(data).forEach((key) => {
        setState("script", "nodes", node_id, key, data[key]);
      });
    }; */

    // INTERNAL FUNCTIONS

    setNodeDimensions: ({ node_id, width, height }) => {
      setState('script', 'nodes', node_id, 'dimensions', { width, height })
    },

    observe: ({ dom }) => observer.observe(dom),
    unobserve: ({ dom }) => observer.unobserve(dom),

    removeNode: node_id => {
      return batch(() => {
        const node = state.script.nodes[node_id]

        if (node.instructions) {
          // remove all instructions that are a part of node
          node.instructions.forEach(instruction_id => {
            // delete instructions[instruction_id];
            setState('script', 'instructions', instruction_id, undefined)
          })
        }

        const roles = { ...node.in_outs }
        const role_ids = Object.keys(roles)

        // remove reference to node in connected nodes
        Object.entries(roles).forEach(([role_id, role]) => {
          if (role.out_node_id != undefined) {
            actions.setConnection({
              node_id: role.out_node_id,
              connecting_node_id: undefined,
              role_id,
              direction: 'in',
            })
          }
          if (role.in_node_id != undefined) {
            actions.setConnection({
              node_id: role.in_node_id,
              connecting_node_id: undefined,
              role_id,
              direction: 'out',
            })
          }
        })
        setState('editor', 'selection', selection =>
          selection.filter(id => id !== node_id),
        )

        setState('script', 'nodes', node_id, undefined)
        return { role_ids }
      })
    },

    setConnection: ({
      node_id,
      connecting_node_id,
      role_id,
      direction,
    }: {
      node_id: string
      connecting_node_id: string | undefined
      role_id: string
      direction: ConnectionDirection
    }) => {
      console.info('set connection!!!', state.script.nodes, node_id)
      setState(
        'script',
        'nodes',
        node_id,
        'in_outs',
        role_id,
        prevOrNext(direction),
        connecting_node_id,
      )
    },

    // METHODS

    addNode: pars => {
      const position = pars?.position ?? {
        x:
          (state.editor.navigation.cursor.x -
            state.editor.navigation.origin.x) /
            state.editor.navigation.zoom -
          450,
        y:
          (state.editor.navigation.cursor.y -
            state.editor.navigation.origin.y) /
          state.editor.navigation.zoom,
      }
      const type = pars?.type ?? 'instruction'

      const node = actions.getDefaultNode()
      const node_id = uniqid()
      node.type = type
      node.instructions = []
      node.position = position

      setState('script', 'nodes', node_id, node)

      return node_id
    },

    removeSelectedNodes: () => {
      const all_role_ids = new Set<string>()
      batch(() => {
        state.editor.selection.forEach(node_id => {
          const { role_ids } = actions.removeNode(node_id)
          role_ids.forEach(all_role_ids.add, all_role_ids)
        })
      })
      all_role_ids.forEach(role_id => actions.controlRole(role_id))
      return { role_ids: all_role_ids }
    },

    duplicateSelectedNodes: () => {
      batch(() => {
        // console.error("removeSelectedNodes is not yet implemented");
        // const all_affected_role_ids = [];
        //

        const node_map: Record<string, string> = {}

        state.editor.selection.forEach(
          node_id => (node_map[node_id] = uniqid()),
        )

        Object.entries(node_map).forEach(([node_id, new_node_id]) => {
          const new_node = clone(state.script.nodes[node_id])
          new_node.position.x += 600
          new_node.instructions = new_node.instructions.map(
            instruction_id => {
              const id = uniqid()
              setState('script', 'instructions', id, {
                ...state.script.instructions[instruction_id],
              })
              return id
            },
          )
          setState('script', 'nodes', new_node_id, new_node)
        })

        Object.values(node_map).forEach(new_node_id => {
          Object.entries(state.script.nodes[new_node_id].in_outs).forEach(
            ([role_id, in_out]) => {
              if (in_out.out_node_id) {
                if (
                  state.editor.selection.indexOf(in_out.out_node_id) === -1
                ) {
                  setState(
                    'script',
                    'nodes',
                    new_node_id,
                    'in_outs',
                    role_id,
                    'out_node_id',
                    undefined,
                  )
                } else {
                  setState(
                    'script',
                    'nodes',
                    new_node_id,
                    'in_outs',
                    role_id,
                    'out_node_id',
                    node_map[in_out.out_node_id],
                  )
                }
              }
              if (in_out.in_node_id) {
                if (
                  state.editor.selection.indexOf(in_out.in_node_id) === -1
                ) {
                  setState(
                    'script',
                    'nodes',
                    new_node_id,
                    'in_outs',
                    role_id,
                    'in_node_id',
                    undefined,
                  )
                } else {
                  setState(
                    'script',
                    'nodes',
                    new_node_id,
                    'in_outs',
                    role_id,
                    'in_node_id',
                    node_map[in_out.in_node_id],
                  )
                }
              }
              return [role_id, in_out]
            },
          )
        })

        actions.removeFromSelection(Object.keys(node_map))
        actions.addToSelection(Object.values(node_map))
      })
      actions.controlRoles()
    },

    addRoleToNode: ({
      node_id,
      role_id,
    }: {
      node_id: string
      role_id: string
    }) => {
      const node = state.script.nodes[node_id]

      if (
        node.type === 'instruction' &&
        Object.keys(node.in_outs).length === 0
      ) {
        const { instruction_id } = actions.addInstruction({ role_id })
        actions.addInstructionIdToNode({ node_id, instruction_id })
      }

      const role = state.script.roles[role_id]

      setState('script', 'nodes', node_id, 'in_outs', role_id, {
        // role_id,
        // node_id,
        hidden: role.hidden,
      })

      actions.controlRole(role_id)
    },

    removeRoleFromNode: ({
      node_id,
      role_id,
    }: {
      node_id: string
      role_id: string
    }) => {
      const instruction_ids = state.script.nodes[
        node_id
      ].instructions.filter(
        instruction_id =>
          state.script.instructions[instruction_id].role_id === role_id,
      )

      // remove node_id from the roles' connected nodes
      const roles = state.script.nodes[node_id].in_outs
      const role = roles[role_id]

      if (Object.keys(roles).length > 1) {
        // null out_node_id from connected prev_node
        if (role.in_node_id) {
          actions.removeConnectionBothWays({
            node_id,
            role_id,
            direction: 'in',
          })
        }

        // null in_node_id from connected next_node
        if (role.out_node_id) {
          actions.removeConnectionBothWays({
            node_id,
            role_id,
            direction: 'out',
          })
        }
        // remove all instructions from node with role_id
        setState(
          'script',
          'nodes',
          node_id,
          'instructions',
          state.script.nodes[node_id].instructions.filter(
            instruction_id =>
              state.script.instructions[instruction_id].role_id !==
              role_id,
          ),
        )

        // remove role_id from roles
        setState('script', 'nodes', node_id, 'in_outs', role_id, undefined)
      } else {
        // remove node completely
        actions.removeNode(node_id)
      }

      // remove from state.script.instructions
      instruction_ids.forEach(instruction_id => {
        setState('script', 'instructions', instruction_id, undefined)
      })

      setTimeout(() => {
        actions.controlRole(role_id)
      }, 1000)
    },

    convertRole: ({ node_ids, source_role_id, target_role_id }) => {
      const reconnections: {
        node_id: string
        connecting_node_id: string
        role_id: string
        direction: ConnectionDirection
      }[] = []

      node_ids.forEach(node_id => {
        const node = state.script.nodes[node_id]
        if (!node.in_outs[source_role_id]) return
        if (!node.in_outs[target_role_id])
          actions.addRoleToNode({
            node_id: node_id,
            role_id: target_role_id,
          })

        node.instructions
          .filter(
            instruction_id =>
              state.script.instructions[instruction_id].role_id ===
              source_role_id,
          )
          .forEach(instruction_id => {
            setState(
              'script',
              'instructions',
              instruction_id,
              'role_id',
              target_role_id,
            )
          })

        const source_in_out = node.in_outs[source_role_id]
        if (source_in_out.in_node_id) {
          // check if
          if (
            state.script.nodes[source_in_out.in_node_id].in_outs[
              target_role_id
            ]
          ) {
            reconnections.push({
              node_id,
              connecting_node_id: source_in_out.in_node_id,
              role_id: target_role_id,
              direction: 'in',
            })
          }
        }
        if (source_in_out.out_node_id) {
          if (
            node_ids.indexOf(source_in_out.out_node_id) !== -1 ||
            state.script.nodes[source_in_out.out_node_id].in_outs[
              target_role_id
            ]
          ) {
            reconnections.push({
              node_id,
              connecting_node_id: source_in_out.out_node_id,
              role_id: target_role_id,
              direction: 'out',
            })
          }
        }
      })

      node_ids.forEach(node_id => {
        const node = state.script.nodes[node_id]
        if (!node.in_outs[source_role_id]) return
        actions.removeRoleFromNode({ node_id, role_id: source_role_id })
      })

      reconnections.forEach(reconnection => {
        actions.addConnection(reconnection)
      })

      actions.controlRole(source_role_id)
      actions.controlRole(target_role_id)
    },

    addInstructionIdToNode: ({
      node_id,
      instruction_id,
      index = false,
    }) => {
      const instruction_ids = [...state.script.nodes[node_id].instructions]
      if (index) {
        setState(
          'script',
          'nodes',
          node_id,
          'instructions',
          array_insert(instruction_ids, index, instruction_id),
        )
      } else {
        setState('script', 'nodes', node_id, 'instructions', [
          ...instruction_ids,
          instruction_id,
        ])
      }
    },

    /*   actions.removeInstructionId = ({ node_id, instruction_id, index }) => {
      setState("script",
        "nodes",
        node_id,
        "instructions",
        array_remove_element(
          state.script.nodes[node_id].instructions,
          instruction_id
        )
      );
    }; */

    translateSelectedNodes: ({ offset }) => {
      state.editor.selection.forEach(node_id => {
        setState('script', 'nodes', node_id, 'position', position => {
          return {
            x: position.x + offset.x / state.editor.navigation.zoom,
            y: position.y + offset.y / state.editor.navigation.zoom,
          }
        })
      })
    },

    addConnection: ({
      node_id,
      connecting_node_id,
      role_id,
      direction,
    }) => {
      // check if connecting_node_id.in_outs[role_id][opposite_direction] is already connected to a node_id
      // if yes: remove reference to connecting_node_id from connecting_node_id.in_outs[role_id][opposite_direction]
      const opposite_direction = reverseDirection(direction)

      const node_id_initially_connected_to_connecting_node =
        state.script.nodes[connecting_node_id].in_outs[role_id] &&
        state.script.nodes[connecting_node_id].in_outs[role_id][
          prevOrNext(opposite_direction)
        ]

      if (node_id_initially_connected_to_connecting_node) {
        // dereference connecting_node at node initially connected to connecting_node
        actions.setConnection({
          node_id: node_id_initially_connected_to_connecting_node,
          connecting_node_id: undefined,
          role_id,
          direction,
        })
      }
      // make reference to connecting_node_id at this node.in_outs[role_id]
      actions.setConnection({
        node_id,
        connecting_node_id,
        role_id,
        direction,
      })
      // make reference to node_id at connecting_node_id.in_outs[role_id]
      actions.setConnection({
        node_id: connecting_node_id,
        connecting_node_id: node_id,
        role_id,
        direction: opposite_direction,
      })
    },

    removeConnectionBothWays: ({ node_id, role_id, direction }) => {
      const connecting_node_id =
        state.script.nodes[node_id].in_outs[role_id][prevOrNext(direction)]

      if (connecting_node_id) {
        // dereference this node_id at initial_connecting_node.in_outs[role_id][opposite_direciton]
        actions.setConnection({
          node_id: connecting_node_id,
          connecting_node_id: undefined,
          role_id,
          direction: reverseDirection(direction),
        })
      }
      // dereference node.in_outs[role_id][direction]
      actions.setConnection({
        node_id,
        connecting_node_id: undefined,
        role_id,
        direction,
      })
    },

    hasRoleId: ({
      node_id,
      role_id,
    }: {
      node_id: string
      role_id: string
    }) => {
      return role_id in state.script.nodes[node_id].in_outs
    },

    ////

    getRoleLength: () => Object.keys(state.script.roles).length,

    getInitialName: () => {
      let highest_integer = 0
      Object.entries(state.script.roles).forEach(([role_id, role]) => {
        if (typeof role.name === 'number' && role.name > highest_integer) {
          highest_integer = role.name
        }
      })
      return highest_integer + 1
    },
    getDefaultRole: () => {
      const name = actions.getInitialName()
      const hue = getRandomHue(+name ?? 0)
      return {
        instruction_ids: [],
        description: '',
        hue,
        name,
      }
    },

    addRoleToScript: () => {
      setState('script', 'roles', uniqid(), actions.getDefaultRole())
    },

    removeRoleFromScript: async (role_id: string) => {
      Object.entries(state.script.nodes).forEach(([node_id, node]) => {
        if (Object.keys(node.in_outs).indexOf(role_id) == -1) return
        actions.removeRoleFromNode({ node_id, role_id })
      })

      // check if role has any instructions associated with it

      /*  const instructions_without_role = Object.entries(state.script.instructions).filter(
         ([instruction_id, instruction]) => instruction.role_id != role_id
       );
   
       if (instructions_without_role.length < Object.keys(state.script.instructions).length) {
         // remove instructions + references to role from nodes
         Object.entries(state.script.nodes).forEach(([node_id, node]) => {
           if (Object.keys(node.in_outs).indexOf(role_id) == -1) return;
           scriptManager.nodes.removeRoleFromNode({ node_id, role_id });
         })
       }
   
       // remove all instructions with role_id
       setState("script", "instructions", { ...arrayOfObjectsToObject(instructions_without_role) }); */
      // remove from roles
      const roles = { ...state.script.roles }
      delete roles[role_id]

      setState('script', {
        nodes: state.script.nodes,
        instructions: state.script.instructions,
        roles: { ...roles },
      })
    },

    setNameRole: ({ role_id, name }) => {
      if (name === '') return
      setState('script', 'roles', role_id, 'name', name)
    },

    /*      let role_id = getRoleLength() + 1;
               setState("script", "roles", role_id, getDefaultRole()); */

    setDescriptionRole: ({ role_id, description }) => {
      setState('script', 'roles', role_id, 'description', description)
    },

    setDescriptionScript: (description: string) =>
      setState('script', 'description', description),

    getEndNodeId: async ({ node_id, role_id }) =>
      actions.getEndNode({ node_id, role_id }),

    traverseRole: ({ role_id, node_id }) =>
      new Promise<
        | {
            success: false
            traversed_node_ids: string[]
            error: {
              type: string
              text: string
              node_ids: string[]
            }
          }
        | {
            success: true
            traversed_node_ids: string[]
          }
      >(resolve => {
        if (!node_id) {
          console.error('ERROR: node_id is incorrect')
          return
        }
        const traversed_node_ids: string[] = []
        function iterateRole(node_id: string) {
          if (traversed_node_ids.indexOf(node_id) != -1) {
            resolve({
              success: false,
              traversed_node_ids,
              error: {
                type: 'infinite_loop',
                text: `found an infinite loop for role ${role_id}.`,
                node_ids: traversed_node_ids,
              },
            })
            return
          }
          traversed_node_ids.push(node_id)
          const out_node_id =
            state.script.nodes[node_id].in_outs[role_id].out_node_id
          if (!out_node_id) {
            resolve({
              success: true,
              traversed_node_ids,
            })
          } else {
            iterateRole(out_node_id)
          }
        }
        iterateRole(node_id)
      }),

    controlRole: async role_id => {
      const errors = []
      // get nodes per role
      const nodes = Object.entries(state.script.nodes).filter(
        ([node_id, node]) => {
          return Object.keys(node.in_outs).indexOf(role_id) !== -1
        },
      )
      const node_ids = nodes.map(([node_id, node]) => node_id)

      // test #1 check for multiple open start/end-nodes for role
      const start_node_ids = nodes
        .filter(([node_id, node]) => !node.in_outs[role_id].in_node_id)
        .map(([node_id, node]) => node_id)

      const end_node_ids = nodes
        .filter(([node_id, node]) => {
          return !('out_node_id' in node.in_outs[role_id])
        })
        .map(([node_id, node]) => node_id)

      let start_end_node_ids = [...start_node_ids, ...end_node_ids]
      ;[start_end_node_ids] = actions.dedupArray(start_end_node_ids)

      if (start_node_ids.length > 1 || end_node_ids.length > 1) {
        errors.push({
          type: 'multiple_open_start_ports',
          text: `more then 2 possible starts for role ${state.script.roles[role_id].name}`,
          node_ids: start_end_node_ids,
        })
      }

      // test #2 look for infinite-loops by recursively iterating
      // through the start_nodes

      const results = await Promise.all(
        start_node_ids.map(node_id =>
          actions.traverseRole({ role_id, node_id }),
        ),
      )

      results.forEach(result => {
        if (!result.success) errors.push(result.error)
      })

      let total_traversed_node_ids = results
        .map(result => result.traversed_node_ids)
        .flat()

      if (total_traversed_node_ids.length != node_ids.length) {
        // this can indicate
        //      a. that there are infinite_loops which are not accessible from start/end-nodes
        //      b. that there are node_ids which are connected to multiple start/end-nodes

        const [deduped_node_ids, duplicate_node_ids] = actions.dedupArray(
          total_traversed_node_ids,
        )

        if (deduped_node_ids.length > total_traversed_node_ids.length) {
          console.error(
            'node_ids were accessed via multiple start/end-nodes, most likely indicating a bug in the editor',
          )
          errors.push({
            type: 'multiple_traversed_node_ids',
            text: `nodes were accessed multiple times for role ${
              state.script.roles[role_id].name
            }: ${duplicate_node_ids.join()} most likely indicating a bug in the editor`,
            node_ids: duplicate_node_ids,
          })
        }

        total_traversed_node_ids = deduped_node_ids

        let unaccessible_node_ids = node_ids.filter(
          node_id => total_traversed_node_ids.indexOf(node_id) === -1,
        )

        if (unaccessible_node_ids.length > 0) {
          console.error(
            'unaccessible_node_ids is not [] :',
            unaccessible_node_ids,
          )

          type TraverseRole = UnboxPromise<
            ReturnType<typeof actions['traverseRole']>
          >

          const traverseAllUnaccessibleNodes = () =>
            new Promise<TraverseRole[]>(resolve => {
              const a = actions.traverseRole

              const results: TraverseRole[] = []

              const traverseRoleFromUnaccessibleNodeId = async (
                node_id: string,
              ) => {
                const result = await actions.traverseRole({
                  role_id,
                  node_id,
                })
                results.push(result)

                unaccessible_node_ids = unaccessible_node_ids.filter(
                  node_id =>
                    result.traversed_node_ids.indexOf(node_id) === -1,
                )

                if (unaccessible_node_ids.length === 0) {
                  resolve(results)
                } else {
                  traverseRoleFromUnaccessibleNodeId(
                    unaccessible_node_ids[0],
                  )
                }
              }
              traverseRoleFromUnaccessibleNodeId(unaccessible_node_ids[0])
            })

          const results = await traverseAllUnaccessibleNodes()
          results.forEach(result => {
            if (!result.success) {
              errors.push(result.error)
            } else {
              console.error(
                'ERROR: unaccessible nodes should not be able to traverse successfully',
                role_id,
                result,
              )
            }
          })
        }
      }

      // console.info("control of role took: ", performance.now() - start, "ms");
      // console.info("total errors of role", role_id, "after control ", errors);

      actions.setErrorsRoleId({
        role_id,
        errors,
      })

      return errors.length == 0
        ? {
            success: true,
            node_ids: total_traversed_node_ids,
          }
        : {
            success: false,
            errors,
          }
    },

    dedupArray: function (array) {
      const seen: Record<string, boolean> = {}
      const duplicates: Record<string, boolean> = {}

      array = array.filter(function (item) {
        if (seen.hasOwnProperty(item)) {
          duplicates[item] = true
          return false
        }
        seen[item] = true
        return true
      })

      return [array, Object.keys(duplicates)]
    },

    // METHODS

    /*   const controlRole = async (role_id) => {
      
    } */
    controlRoles: async (
      role_ids: string[] = Object.keys(state.script['roles']),
    ) => {
      const roles: Record<
        string,
        UnboxPromise<ReturnType<Actions['controlRole']>>
      > = {}

      for (const role_id of role_ids) {
        roles[role_id] = await actions.controlRole(role_id)
      }

      return roles
    },

    getEndNode: async ({
      node_id,
      role_id,
    }: {
      node_id: string
      role_id: string
    }) => {
      const { traversed_node_ids } = await actions.traverseRole({
        node_id,
        role_id,
      })
      return traversed_node_ids[traversed_node_ids.length - 1]
    },

    getNextRoleIdsOfLast: node =>
      Object.values(node.in_outs)
        .filter(role => role.out_node_id)
        .map(role => {
          const connected_node = state.script.nodes[role.out_node_id!]
          const next_instruction_id = connected_node.instructions[0]
          if (!next_instruction_id) {
            return undefined
          }
          return state.script.instructions[next_instruction_id].role_id
        })
        .filter((value, index, self) => self.indexOf(value) === index),

    getPrevInstructionIdsOfFirst: node =>
      Object.values(node.in_outs)
        .filter(role => role.in_node_id)
        .map(role => {
          const connected_node = state.script.nodes[role.in_node_id!]
          return connected_node.instructions[
            connected_node.instructions.length - 1
          ]
        })
        .filter((value, index, self) => self.indexOf(value) === index),

    processScript: async () => {
      try {
        const processed_roles = await actions.controlRoles()

        // CHECK: MAKE SURE ALL ROLES ARE PRESENT

        if (
          !arraysMatch(
            Object.keys(state.script.roles),
            Object.keys(processed_roles),
          )
        )
          throw [
            'error in controlRoles(): processed_roles does not match with state.script.roles',
            Object.keys(state.script.roles),
            Object.keys(processed_roles),
          ]

        const errored_roles = Object.entries(processed_roles).filter(
          ([role_id, processed_role]) => !processed_role.success,
        )

        if (errored_roles.length > 0)
          throw [`controlRoles had errors:`, errored_roles]

        const instructions = processInstructions()

        if (!instructions) throw `processInstructions failed`

        const instructions_per_role = Object.fromEntries(
          Object.entries(state.script['roles']).map(([role_id, role]) => [
            role_id,
            {
              name: role.name,
              instructions: (processed_roles[role_id].node_ids ?? [])
                .map(node_id =>
                  state.script.nodes[node_id].instructions
                    .filter(
                      instruction_id =>
                        instructions[instruction_id].role_id === role_id,
                    )
                    .map(instruction_id => {
                      const instruction = {
                        ...instructions[instruction_id],
                        instruction_id,
                      }
                      delete instruction.role_id
                      return instruction
                    }),
                )
                .reduce((a, b) => a.concat(b), []),
            },
          ]),
        ) as Record<
          string,
          {
            name: string
            instructions: (Instruction & { instruction_id: string })[]
          }
        >

        // check if instructions_per_role shows any artefacts:
        // are all the instructions really of the same role???
        // there was possibly a bug in which this

        Object.entries(instructions_per_role).forEach(
          ([role_id, role]) => {
            role.instructions.forEach(instruction => {
              if (
                state.script.instructions[instruction.instruction_id]
                  .role_id !== role_id
              ) {
                throw [
                  `error while filtering instructions_per_role with role_id ${role_id} and instruction_id ${instruction.instruction_id}`,
                  instructions_per_role,
                ]
              }
            })
          },
        )

        return instructions_per_role
      } catch (err) {
        console.error(err)
        return false
      }
    },

    testProcessScript: () => {
      let i = 0
      const MAX = 1000
      const iterate = async () => {
        const res = await actions.processScript()
        if (!res) return
        i++

        if (i < MAX) setTimeout(iterate, 50)
      }
      iterate()
    },
    processVideo: (file, instruction_id) =>
      new Promise<UploaderResponse>(async resolve => {
        const uploader = new Uploader()
        const start_time = new Date().getTime()
        setState('editor', 'uploaders', start_time, {
          state: 'uploading',
          progress: { percentage: 0 },
          instruction_id,
        })
        uploader.onProgress(progress => {
          setState('editor', 'uploaders', start_time, 'progress', progress)

          if (progress.percentage === 100) {
            setState(
              'editor',
              'uploaders',
              start_time,
              'state',
              'processing',
            )
          }
        })
        const result = await uploader.process({
          url: `${urls.fetch}/api/video/upload/${state.script.script_id}/mp4`,
          data: {
            file,
            instruction_id,
          },
        })

        if (result.success) {
          setState('editor', 'uploaders', start_time, 'state', 'completed')
        } else {
          setState('editor', 'uploaders', start_time, 'state', 'failed')
        }

        setTimeout(
          () => setState('editor', 'uploaders', start_time, undefined),
          2000,
        )

        resolve(result)
      }),

    groupSelectedNodes: () => {
      const selection = [...state.editor.selection]

      const group = actions.getDefaultGroup()
      // group.children = { ...state.editor.selection };
      const group_id = uniqid()
      const node = actions.getDefaultNode()

      node.type = 'group'
      node.parent_id = group_id
      node.position = {
        x: state.editor.navigation.cursor.x - 450,
        y: state.editor.navigation.cursor.y,
      }

      selection.forEach(node_id => {
        Object.keys(state.script.nodes[node_id].in_outs).forEach(
          role_id => {
            group.in_outs[role_id] = {
              in_node_id: undefined,
              out_node_id: undefined,
            }
            node.in_outs[role_id] = {
              in_node_id: undefined,
              out_node_id: undefined,
            }
          },
        )
      })

      // Object.keys(group.in_outs).forEach(role_id => )

      setState('script', 'groups', group_id, group)
      setState('script', 'nodes', uniqid(), node)

      selection.forEach(node_id => {
        setState('script', 'nodes', node_id, 'parent_id', group_id)
      })
    },

    mergeSelectedNodes: () => {
      const selected_nodes = state.editor.selection.map(
        node_id => [node_id, state.script.nodes[node_id]] as const,
      )
      const [root_node_id, root_node] = selected_nodes.shift() as [
        string,
        Node,
      ]

      // save all the connections, instructions somewhere
      const all_in_outs = selected_nodes.map(
        ([node_id, node]) => node.in_outs,
      )

      const all_instructions = selected_nodes.map(([node_id, node]) =>
        node.instructions.map(
          instruction_id =>
            [
              instruction_id,
              state.script.instructions[instruction_id],
            ] as const,
        ),
      )

      // delete all groups except the first one
      selected_nodes.forEach(([node_id]) => actions.removeNode(node_id))

      // re-connect all the connections to the first one (prioritize first one)
      all_in_outs.forEach(in_outs => {
        Object.entries(in_outs).forEach(([role_id, in_out]) => {
          actions.addRoleToNode({
            node_id: root_node_id,
            role_id,
          })
          if (in_out.in_node_id) {
            actions.addConnection({
              node_id: root_node_id,
              connecting_node_id: in_out.in_node_id,
              role_id,
              direction: 'in',
            })
          }
          if (in_out.out_node_id) {
            actions.addConnection({
              node_id: root_node_id,
              connecting_node_id: in_out.out_node_id,
              role_id,
              direction: 'out',
            })
          }
        })
      })

      // add instructions back to root_node

      all_instructions.forEach(instructions =>
        instructions.forEach(([instruction_id, instruction]) => {
          actions.addInstruction({
            role_id: instruction.role_id,
            instruction,
            instruction_id,
          })
          actions.addInstructionIdToNode({
            node_id: root_node_id,
            instruction_id: instruction_id,
          })
        }),
      )

      actions.controlRoles()
    },

    saveScript: async () => {
      try {
        const processed_roles = await actions.processScript()
        if (!processed_roles) {
          const result = await actions.openPrompt({
            type: 'confirm',
            header:
              'the script is not playable, are you sure you want to save?',
          })
          if (!result) return
        }

        const processed_nodes = mapObject(state.script.nodes)(
          (key, value) => {
            delete value.visible
            return value as ProcessedNode
          },
        )

        return await postData(
          `${urls.fetch}/api/script/save/${state.script.script_id}`,
          {
            development: {
              design_id: state.script.design_id,
              nodes: processed_nodes,
              instructions: state.script.instructions,
              roles: state.script.roles,
              groups: state.script.groups,
            },
            production: {
              design_id: state.script.design_id,
              roles: processed_roles,
            },
            script_id: state.script.script_id,
          },
        )
      } catch (err) {
        console.error(err)
        return false
      }
    },

    createGame: async () => {
      try {
        const roles = await actions.processScript()

        if (!roles) throw 'processScript failed'

        const { error } = await postData(
          `${urls.fetch}/api/script/test/${state.script.script_id}`,
          {
            roles,
            design_id: state.script.design_id,
          },
        )
        if (error) throw error
        return true
      } catch (err) {
        console.error(err)
        return false
      }
    },

    fetchGeneralData: async () => {
      const card_designs = await getData(
        `${urls.fetch}/api/design/get_all`,
      )
    },

    fetchScript: async () => {
      const data = (await getData(
        `${urls.fetch}/api/script/get/${state.script.script_id}/development`,
      )) as State['script']

      if (!data) {
        actions.setBool('isInitialized', true)
        actions.addRoleToScript()
        actions.addRoleToScript()
        return
      }

      batch(() => {
        actions.setRoles(data.roles ? data.roles : {})
        actions.setNodes(data.nodes)

        const instructions = data.instructions ? data.instructions : {}

        Object.entries(instructions)
          .filter(
            ([instruction_id, instruction]) =>
              instruction.type === 'video' &&
              instruction.text !== '' &&
              !instruction.filesize,
          )
          .forEach(async ([instruction_id, instruction]) => {
            const response = await fetch(urls.fetch + instruction.text, {
              method: 'HEAD',
            })
            if (response.status === 200) {
              const contentLength = response.headers.get('Content-Length')
              if (!contentLength) {
                console.error('Content-Length is null')
                return
              }
              actions.setFilesize({
                instruction_id,
                filesize: parseInt(contentLength),
              })
            }
          })

        actions.setInstructions(data.instructions ? data.instructions : {})

        actions.setGroups(data.groups ? data.groups : {})

        actions.setDesignId(
          data.design_id ? data.design_id : 'europalia3_mikey',
        )
      })
    },
  }

  const q = new Q()

  return (
    <StoreContext.Provider value={[state, actions, q]}>
      {props.children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext) as Context
}
