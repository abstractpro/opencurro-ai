export interface ModelsDevModel {
  id: string
  name: string
  description: string
  attachment: boolean
  reasoning: boolean
  tool_call: boolean
  open_weights: boolean
  release_date: string
  last_updated: string
  modalities: {
    input: string[]
    output: string[]
  }
  limit: {
    context: number
    output: number
  }
  family?: string
  cost?: {
    input: number
    output: number
    cache_read?: number
    cache_write?: number
  }
  reasoning_options?: Array<
    | { type: 'toggle' }
    | { type: 'effort'; values: string[] }
    | { type: 'budget_tokens'; min: number; max?: number }
  >
  temperature?: boolean
  knowledge?: string
  structured_output?: boolean
  status?: string
  provider?: {
    api?: string
    npm?: string
  }
}

export interface ModelsDevProvider {
  id: string
  name: string
  npm: string
  env: string[]
  doc: string
  api?: string
  models: Record<string, ModelsDevModel>
}

export type ModelsDevCatalog = Record<string, ModelsDevProvider>

export interface ModelsDevModelEntry {
  modelId: string
  model: ModelsDevModel
}

export interface ProviderDisplayInfo {
  id: string
  name: string
  modelCount: number
  logoUrl: string
  docUrl: string
  npm: string
  env: string[]
  api?: string
}
