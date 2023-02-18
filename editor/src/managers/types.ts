import { JSXElement } from 'solid-js'

export type UnboxPromise<T extends Promise<any>> = T extends Promise<
  infer U
>
  ? U
  : never

export type InOuts = Record<
  string,
  {
    in_node_id: string | undefined
    out_node_id: string | undefined
    hidden: boolean
  }
>

export type Group = {
  parent_id: string
  description: string
  in_outs: InOuts
}

export type Dimensions = {
  width: number
  height: number
}

export type Node = {
  type: 'instruction' | 'trigger' | 'group' | undefined
  parent_id: string
  position: Vector
  instructions: string[]
  dimensions: Dimensions
  in_outs: InOuts
  visible: boolean
  group_id: string
}

export type ProcessedNode = {
  type: 'instruction' | 'trigger' | 'group' | undefined
  parent_id: string
  position: Vector
  instructions: string[]
  dimensions: Dimensions
  in_outs: InOuts
}

export type ProcessedRole =
  | {
      success: true
      node_ids: string[]
    }
  | {
      success: false
      node_ids: undefined
    }

export type Role = {
  description: string
  name: string | number
  hue: number
  hidden?: boolean
}

export type TextNormal = {
  type: 'normal'
  content: string
}
export type TextChoice = {
  type: 'choice'
  content: string[]
}

export type Text = TextNormal | TextChoice

export type Instruction =
  | {
      role_id: string
      text: string
    } & (
      | {
          role_id: string
          type: 'do' | 'say'
          timespan: number | undefined
          sound: boolean
          filesize?: undefined
        }
      | {
          type: 'video'
          modified: number
          filesize: number
          timespan?: undefined
          sound?: undefined
        }
    )

export type ProcessedInstruction =
  | {
      role_id: string
      type: 'do' | 'say'
      text: Text[]
      timespan: number | undefined
    }
  | {
      role_id: string
      type: 'video'
      text: string
      timespan: number | undefined
    }

type PromptGeneral = {
  header: JSXElement
  position?: Vector
}

export type PromptAddRole = PromptGeneral & {
  type: 'addRole'
  data: { node: Node; roles: Record<string, Role> }
  resolve: (role_id: string) => void
}

export type PromptConfirm = PromptGeneral & {
  type: 'confirm'
  data: JSXElement
  resolve: (confirm: boolean) => void
}

export type PromptOptions = PromptGeneral & {
  type: 'options'
  data: {
    options: any[]
  }
  resolve: (option: any) => void
}

export type Prompt = PromptAddRole | PromptConfirm | PromptOptions

export type Error = {
  node_ids: string[]
  text: string
}

export type SelectionBox = {
  width: number
  height: number
  top: number
  left: number
}

export type Vector = { x: number; y: number }

export type Connection = {
  in_node_id: string
  out_node_id: string
  role_id: string
  direction: 'in' | 'out'
  cursor: Vector
}

export type ConnectionDirection = 'in' | 'out'

export type TemporaryConnection = {
  node_id: string
  out_node_id?: string
  role_id: string
  direction: ConnectionDirection
  cursor: Vector
}

export type State = {
  script: {
    groups: Record<string, Group>
    nodes: Record<string, Node>
    roles: Record<string, Role>
    instructions: Record<string, Instruction>
    description: string
    script_id?: string
    design_id?: string
  }
  editor: {
    navigation: {
      cursor: Vector
      origin: Vector
      origin_grid: [Vector, Vector]
      zoom: number
      zoomedOut: boolean
      grid_size: number
    }
    gui: {
      prompt: false | Prompt
      selectionBox: false | SelectionBox
      role_admin: false | unknown
      tooltip: false | string
      sub_menu: false | unknown
    }
    bools: {
      isConnecting: boolean
      isInitialized: boolean
      isShiftPressed: boolean
      isCtrlPressed: boolean
      isMenuOpen: boolean
      isTranslating: boolean
      isZoomedOut: boolean
    }
    errors: Record<string, Error[]>
    errored_node_ids: string[]
    selection: string[]
    role_offsets: Record<string, any>
    node_dimensions: Record<string, { x: number; y: number }>
    temporary_connections: TemporaryConnection[]
    uploaders: {
      state: 'uploading' | 'processing' | 'completed' | 'failed'
      progress: { percentage: number }
      instruction_id: string
    }[]
    visited_parent_ids: string[]
    parent_ids: string[]
  }
}

export type Actions = {
  updateErroredNodeIds: () => void

  //// PUBLIC FUNCTIONS
  setCursor: (cursor: Vector) => void
  getCursor: () => Vector

  setSelectionBox: (selection_box?: SelectionBox) => void
  getSelectionBox: () => SelectionBox

  getOrigin: () => Vector

  getOriginGrid: () => void

  setOrigin: (origin: Vector) => void

  offsetOrigin: (delta: Vector) => void

  updateOriginGrid: () => void

  getZoom: () => number

  setErrorsRoleId: ({
    role_id,
    errors,
  }: {
    role_id: string
    errors: Error[]
  }) => void

  openGui: (type: keyof State['editor']['gui']) => void
  closeGui: (type: keyof State['editor']['gui']) => void
  toggleGui: (type: keyof State['editor']['gui']) => void

  openPrompt: (prompt: Prompt) => Promise<string>

  closePrompt: () => void

  setTooltip: (tooltip: string | false) => void

  closeRoleAdmin: () => void

  // navigation

  calcPositionOffsetZoom: (axis: 'x' | 'y', delta: number) => number

  updateZoomedOut: () => void

  limitZoom: (zoom: number) => number

  updateZoomState: (zoom: number, delta: number) => number

  offsetZoom: (delta: number) => void

  zoomIn: () => void

  zoomOut: () => void

  addToSelection: (node_ids: string | string[]) => void

  removeFromSelection: (node_ids: string | string[]) => void

  emptySelection: () => void

  emptyRoleOffset: () => void

  updateRoleOffset: ({
    node_id,
    role_id,
    direction,
    offset,
  }: {
    node_id: string
    role_id: string
    direction: ConnectionDirection
    offset: Vector & Dimensions
  }) => void

  setConnecting: (bool: boolean) => void
  addTemporaryConnection: ({
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
  }) => void

  removeTemporaryConnection: ({
    node_id,
    role_id,
    direction,
  }: {
    node_id: string
    role_id: string
    direction: ConnectionDirection
  }) => void

  navigateToNodeId: (node_id: string) => void

  setBool: (
    bool_type: keyof State['editor']['bools'],
    bool: boolean,
  ) => void
  setSubMenu: (type: State['editor']['gui']['sub_menu']) => void
  toggleSubMenu: (type: State['editor']['gui']['sub_menu']) => void
  getRoleOffset: ({
    node_id,
    role_id,
    direction,
  }: {
    node_id: string
    role_id: string
    direction: ConnectionDirection
  }) => Vector

  enterGroup: (group_id: string) => void

  enterVisitedGroup: ({
    group_id,
    index,
  }: {
    group_id: string
    index: number
  }) => void

  initWindowInteractions: () => void

  // SCRIPT

  getDefaultInstruction: (role_id: string) => Instruction

  getDefaultNode: () => Node

  getDefaultGroup: () => Group

  setInstructions: (instructions: Record<string, Instruction>) => void
  setRoles: (roles: Record<string, Role>) => void
  setGroups: (groups: Record<string, Group>) => void
  setNodes: (nodes: Record<string, Node>) => void

  setScriptId: (script_id: string) => void

  setDesignId: (design_id: string) => void

  setParentIds: (parent_ids: string[]) => void

  //

  iterateNodes: (nodes: [string, Node][]) => void

  //// INSTRUCTIONS

  addInstruction: ({
    role_id,
    instruction,
    instruction_id,
  }: {
    role_id: string
    instruction?: Instruction
    instruction_id?: string
  }) => {
    instruction: Instruction
    instruction_id: string
  }

  removeInstruction: ({
    instruction_id,
    node_id,
  }: {
    instruction_id: string
    node_id: string
  }) => void

  setInstruction: (
    instruction_id: string,
    data: Partial<Instruction>,
  ) => void
  setFilesize: ({
    instruction_id,
    filesize,
  }: {
    instruction_id: string
    filesize: number
  }) => void

  //// BLOCKS

  /*   const updateNode = (node_id, data) => {
    let node = state.script.nodes[node_id];
    if (!node) return;

    Object.keys(data).forEach((key) => {
      setState("script", "nodes", node_id, key, data[key]);
    });
  }; */

  // INTERNAL FUNCTIONS

  setNodeDimensions: ({
    node_id,
    width,
    height,
  }: {
    node_id: string
    width: number
    height: number
  }) => void

  observe: ({ dom }: { dom: HTMLElement }) => void
  unobserve: ({ dom }: { dom: HTMLElement }) => void

  removeNode: (node_id: string) => { role_ids: string[] }

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
  }) => void

  // METHODS

  addNode: (node?: {
    position: Vector
    type: 'instruction' | 'trigger'
  }) => string

  removeSelectedNodes: () => { role_ids: Set<string> }

  duplicateSelectedNodes: () => void

  addRoleToNode: ({
    node_id,
    role_id,
  }: {
    node_id: string
    role_id: string
  }) => void

  removeRoleFromNode: ({
    node_id,
    role_id,
  }: {
    node_id: string
    role_id: string
  }) => void

  convertRole: ({
    node_ids,
    source_role_id,
    target_role_id,
  }: {
    node_ids: string[]
    source_role_id: string
    target_role_id: string
  }) => void

  addInstructionIdToNode: ({
    node_id,
    instruction_id,
    prev_instruction_id,
    index,
  }: {
    node_id: string
    instruction_id: string
    prev_instruction_id: string
    index?: number
  }) => void

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

  translateSelectedNodes: ({ offset }: { offset: Vector }) => void

  addConnection: ({
    node_id,
    connecting_node_id,
    role_id,
    direction,
  }: {
    node_id: string
    connecting_node_id: string
    role_id: string
    direction: ConnectionDirection
  }) => void

  removeConnectionBothWays: ({
    node_id,
    role_id,
    direction,
  }: {
    node_id: string
    role_id: string
    direction: ConnectionDirection
  }) => void
  hasRoleId: ({
    node_id,
    role_id,
  }: {
    node_id: string
    role_id: string
  }) => boolean

  ////

  getRoleLength: () => number

  getInitialName: () => number

  getDefaultRole: () => Role

  addRoleToScript: () => void

  removeRoleFromScript: (role_id: string) => void

  setNameRole: ({
    role_id,
    name,
  }: {
    role_id: string
    name: string
  }) => void

  /*      let role_id = getRoleLength() + 1;
             setState("script", "roles", role_id, getDefaultRole()); */

  setDescriptionRole: ({
    role_id,
    description,
  }: {
    role_id: string
    description: string
  }) => void

  setDescriptionScript: (description: string) => void
  getEndNodeId: ({
    node_id,
    role_id,
  }: {
    node_id: string
    role_id: string
  }) => Promise<string>

  traverseRole: ({
    role_id,
    node_id,
  }: {
    role_id: string
    node_id: string
  }) => Promise<
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
  >

  controlRole: (role_id: string) => Promise<ProcessedRole>

  dedupArray: (array: string[]) => [string[], string[]]

  // METHODS

  controlRoles: (
    role_ids?: string[],
  ) => Promise<Record<string, ProcessedRole>>

  getEndNode: ({
    node_id,
    role_id,
  }: {
    node_id: string
    role_id: string
  }) => Promise<string>

  getNextRoleIdsOfLast: (node: Node) => (string | undefined)[]

  getPrevInstructionIdsOfFirst: (node: Node) => string[]

  processScript: () => Promise<
    boolean | Record<string, { name: string; instructions: Instruction[] }>
  >

  testProcessScript: () => void
  processVideo: (
    file: File,
    instruction_id: string,
  ) => Promise<
    | {
        success: true
        response: string
      }
    | {
        success: false
        error: string
      }
  >

  groupSelectedNodes: () => void

  mergeSelectedNodes: () => void

  saveScript: () => void

  createGame: () => Promise<boolean>

  fetchGeneralData: () => Promise<void>

  fetchScript: () => Promise<void>
}
