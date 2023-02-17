export type Script = {
  roles: Record<string, Role>
  design_id: string
}

export type Role = {
  instructions: Instruction[]
  name: string
}

export type Instruction = {
  instruction_id: string
  prev_instruction_ids: string[]
  next_role_ids: string[]
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
