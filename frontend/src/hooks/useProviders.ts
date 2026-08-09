import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchModelsDevCatalog, getProviderDisplayList, getProviderModels } from '@/lib/modelsDev'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { ModelsDevModel, ProviderDisplayInfo } from '@/types/modelsDev'

export function useProviders() {
  const {
    modelsDevCatalog,
    selectedProvider,
    selectedModel,
    setModelsDevCatalog,
    setSelectedModel,
  } = useSettingsStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (modelsDevCatalog) return
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        const catalog = await fetchModelsDevCatalog()
        setModelsDevCatalog(catalog)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load provider catalog')
      } finally {
        setLoading(false)
      }
    }
    void run()
  }, [modelsDevCatalog, setModelsDevCatalog])

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const catalog = await fetchModelsDevCatalog(true)
      setModelsDevCatalog(catalog)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh provider catalog')
    } finally {
      setLoading(false)
    }
  }, [setModelsDevCatalog])

  const providers: ProviderDisplayInfo[] = useMemo(
    () => (modelsDevCatalog ? getProviderDisplayList(modelsDevCatalog) : []),
    [modelsDevCatalog],
  )

  const currentModels: ModelsDevModel[] = useMemo(
    () => (modelsDevCatalog ? getProviderModels(modelsDevCatalog, selectedProvider) : []),
    [modelsDevCatalog, selectedProvider],
  )

  const selectFirstModel = useCallback(() => {
    if (currentModels.length > 0 && !selectedModel) {
      setSelectedModel(currentModels[0].id)
    }
  }, [currentModels, selectedModel, setSelectedModel])

  return {
    catalog: modelsDevCatalog,
    providers,
    models: currentModels,
    loading,
    error,
    refresh,
    selectFirstModel,
  }
}
