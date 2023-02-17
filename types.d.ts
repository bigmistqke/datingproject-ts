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
