export type Vector = { x: number; y: number }

export type Dimensions = {
  width: number
  height: number
}

export type Script = {
  roles: Record<string, Role>
  design_id: string
}

export type Role = {
  instructions: Instruction[]
  name: string
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

export type InstructionEditor =
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

type GeneralInstruction = {
  role_id: string
  timespan: number | undefined
  prev_instruction_ids: string[]
  next_role_ids: string[]
  sound?: undefined
  delta?: number
  swiped: boolean
  instruction_id: string
}

export type VideoInstruction = GeneralInstruction & {
  type: 'video'
  text: string
  modified: number
  filesize: number
}

export type TextInstruction = GeneralInstruction & {
  type: 'do' | 'say' | 'think' | 'narrate'
  text: Text[]
}

export type Instruction = TextInstruction | VideoInstruction

type DesignElementGeneral = {
  id: number
  position: Vector
  masked?: boolean
  dimensions: {
    width: number
    height: number
  }
  modes: {
    timed: boolean
    choice: boolean
  }
  type: 'svg' | 'instruction' | 'countdown' | 'text'
  styles: Record<string, any>
  highlight_styles: Record<string, any>
}

export type DesignElementSvg = DesignElementGeneral & {
  type: 'svg'
  svg: {
    normal: any
    masked: any
  }
}

export type DesignElementText = DesignElementGeneral & {
  type: 'text'
}

export type DesignElement = DesignElementSvg | DesignElementText

export type Design = {
  production: {
    modified: number
    types: Record<string, DesignElement[]>
    border_radius: number
    card_dimensions: {
      width: number
      height: number
    }
  }
}

export type Stats = {
  // play_times: number[]
}[]
