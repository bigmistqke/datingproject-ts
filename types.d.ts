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
}

type DesignElementGeneral = {
  id: number
  dimensions: {
    width: number
    height: number
  }
}

type DesignElementSvg = DesignElementGeneral & {
  type: 'svg'
  svg: {
    normal: any
    masked: any
  }
}

type DesignElementText = DesignElementGeneral & {
  type: 'text'
}

type DesignElement = DesignElementSvg | DesignElementText

export type Design = {
  production: {
    types: Record<string, DesignElement[]>
    card_dimensions: {
      width: number
      height: number
    }
  }
}
