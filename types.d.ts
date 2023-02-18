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

export type InstructionProgress =
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

export type Instruction =
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

type DesignElementGeneral = {
  id: number
  dimensions: {
    width: number
    height: number
  }
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
    types: Record<string, DesignElement[]>
    card_dimensions: {
      width: number
      height: number
    }
  }
}
