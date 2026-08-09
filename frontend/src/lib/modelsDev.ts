import type {
  ModelsDevCatalog,
  ModelsDevModel,
  ModelsDevProvider,
  ProviderDisplayInfo,
} from '@/types/modelsDev'

const API_URL = 'https://models.dev/api.json'
const CACHE_KEY = 'modelsdev-catalog-cache'
const CACHE_TS_KEY = 'modelsdev-catalog-ts'
const CACHE_TTL_MS = 1000 * 60 * 60

let catalogPromise: Promise<ModelsDevCatalog> | null = null
let cachedCatalog: ModelsDevCatalog | null = null

export async function fetchModelsDevCatalog(forceRefresh = false): Promise<ModelsDevCatalog> {
  if (cachedCatalog && !forceRefresh) return cachedCatalog
  if (catalogPromise && !forceRefresh) return catalogPromise

  catalogPromise = (async () => {
    try {
      if (!forceRefresh) {
        const stored = readCache()
        if (stored) {
          cachedCatalog = stored
          return stored
        }
      }

      const response = await fetch(API_URL)
      if (!response.ok) {
        throw new Error(`Failed to fetch models.dev catalog: ${response.status}`)
      }

      const data = (await response.json()) as ModelsDevCatalog
      cachedCatalog = data
      writeCache(data)
      return data
    } finally {
      catalogPromise = null
    }
  })()

  return catalogPromise
}

export function getProviderLogoUrl(providerId: string): string {
  return `https://models.dev/logos/${providerId}.svg`
}

export function getProviderDisplayList(catalog: ModelsDevCatalog): ProviderDisplayInfo[] {
  return Object.entries(catalog)
    .map(([, provider]) => ({
      id: provider.id,
      name: provider.name,
      modelCount: Object.keys(provider.models).length,
      logoUrl: getProviderLogoUrl(provider.id),
      docUrl: provider.doc,
      npm: provider.npm,
      env: provider.env,
      api: provider.api,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function getProviderModels(catalog: ModelsDevCatalog, providerId: string): ModelsDevModel[] {
  const provider = catalog[providerId]
  if (!provider) return []
  return Object.values(provider.models).sort((a, b) => a.name.localeCompare(b.name))
}

export function searchProviders(
  providers: ProviderDisplayInfo[],
  query: string,
): ProviderDisplayInfo[] {
  if (!query.trim()) return providers
  const lower = query.toLowerCase()
  return providers.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.id.toLowerCase().includes(lower),
  )
}

export function searchModels(models: ModelsDevModel[], query: string): ModelsDevModel[] {
  if (!query.trim()) return models
  const lower = query.toLowerCase()
  return models.filter(
    (m) =>
      m.name.toLowerCase().includes(lower) ||
      m.id.toLowerCase().includes(lower) ||
      (m.family?.toLowerCase().includes(lower) ?? false),
  )
}

export function inferBaseUrl(provider: ModelsDevProvider): string | undefined {
  if (provider.api) return provider.api
  return undefined
}

export function getModelsDevProvider(catalog: ModelsDevCatalog, providerId: string): ModelsDevProvider | undefined {
  return catalog[providerId]
}

function readCache(): ModelsDevCatalog | null {
  try {
    const ts = localStorage.getItem(CACHE_TS_KEY)
    if (!ts) return null
    const age = Date.now() - Number(ts)
    if (age > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY)
      localStorage.removeItem(CACHE_TS_KEY)
      return null
    }
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ModelsDevCatalog
  } catch {
    return null
  }
}

function writeCache(catalog: ModelsDevCatalog): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(catalog))
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()))
  } catch {
    // Storage may be full or unavailable
  }
}
