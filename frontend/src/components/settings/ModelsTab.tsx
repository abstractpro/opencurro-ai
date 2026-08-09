import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Eye, EyeOff, Key, Loader2, RefreshCcw, Search, X } from 'lucide-react'

import { Section } from '@/components/settings/Section'
import { inputClass } from '@/components/settings/styles'
import { useProviders } from '@/hooks/useProviders'
import { useSettingsStore } from '@/store/useSettingsStore'
import { cn } from '@/lib/utils'
import type { ModelsDevModel, ProviderDisplayInfo } from '@/types/modelsDev'
import { getProviderLogoUrl } from '@/lib/modelsDev'

function formatPrice(value: number): string {
  if (value === 0) return 'Free'
  if (value < 0.01) return `$${value.toFixed(4)}`
  if (value < 1) return `$${value.toFixed(3)}`
  return `$${value.toFixed(2)}`
}

function formatContext(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`
  return String(tokens)
}

function ProviderLogo({ providerId, className }: { providerId: string; className?: string }) {
  const [error, setError] = useState(false)
  if (error) {
    return (
      <div className={cn('grid place-items-center rounded-[10px] bg-[rgba(59,130,246,0.12)] text-[#3b82f6] font-bold text-xs', className)}>
        {providerId.charAt(0).toUpperCase()}
      </div>
    )
  }
  return (
    <img
      src={getProviderLogoUrl(providerId)}
      alt=""
      className={cn('rounded-[10px] object-contain', className)}
      onError={() => setError(true)}
    />
  )
}

function ProviderSelector({
  providers,
  selectedProvider,
  onSelect,
}: {
  providers: ProviderDisplayInfo[]
  selectedProvider: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selected = providers.find((p) => p.id === selectedProvider)

  const filtered = useMemo(() => {
    if (!search.trim()) return providers
    const q = search.toLowerCase()
    return providers.filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
  }, [providers, search])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-[14px] border border-border bg-white px-4 py-3 text-left transition-colors hover:border-[#ffc700] focus:border-[#ffc700] outline-none"
      >
        {selected ? (
          <>
            <ProviderLogo providerId={selected.id} className="size-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#34322d] truncate">{selected.name}</div>
              <div className="text-[11px] text-[#858481]">{selected.modelCount} models</div>
            </div>
          </>
        ) : (
          <div className="flex-1 text-sm text-[#858481]">Select a provider</div>
        )}
        <ChevronDown className={cn('size-4 shrink-0 text-[#858481] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[320px] overflow-hidden rounded-[14px] border border-border bg-white shadow-lg">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#858481]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search providers..."
                className="w-full rounded-[10px] border border-border bg-[#f5f5f5] py-2 pl-9 pr-3 text-sm text-[#34322d] outline-none placeholder:text-[#858481] focus:border-[#ffc700]"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[260px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[#858481]">No providers found</div>
            ) : (
              filtered.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => {
                    onSelect(provider.id)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-[rgba(255,199,0,0.1)]',
                    provider.id === selectedProvider && 'bg-[rgba(255,199,0,0.08)]',
                  )}
                >
                  <ProviderLogo providerId={provider.id} className="size-7 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-[#34322d] truncate">{provider.name}</div>
                    <div className="text-[10px] text-[#858481]">{provider.id} · {provider.modelCount} models</div>
                  </div>
                  {provider.id === selectedProvider && <Check className="size-4 shrink-0 text-[#ffc700]" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ModelSelector({
  models,
  selectedModel,
  onSelect,
}: {
  models: ModelsDevModel[]
  selectedModel: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selected = models.find((m) => m.id === selectedModel)

  const filtered = useMemo(() => {
    if (!search.trim()) return models
    const q = search.toLowerCase()
    return models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.family?.toLowerCase().includes(q) ?? false),
    )
  }, [models, search])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-[14px] border border-border bg-white px-4 py-3 text-left transition-colors hover:border-[#ffc700] focus:border-[#ffc700] outline-none"
      >
        {selected ? (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-[#34322d] truncate">{selected.name}</div>
            <div className="text-[11px] text-[#858481] truncate">{selected.id}</div>
          </div>
        ) : (
          <div className="flex-1 text-sm text-[#858481]">Select a model</div>
        )}
        <ChevronDown className={cn('size-4 shrink-0 text-[#858481] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[400px] overflow-hidden rounded-[14px] border border-border bg-white shadow-lg">
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#858481]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models..."
                className="w-full rounded-[10px] border border-border bg-[#f5f5f5] py-2 pl-9 pr-3 text-sm text-[#34322d] outline-none placeholder:text-[#858481] focus:border-[#ffc700]"
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[340px] overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[#858481]">No models found</div>
            ) : (
              filtered.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelect(model.id)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors hover:bg-[rgba(255,199,0,0.1)]',
                    model.id === selectedModel && 'bg-[rgba(255,199,0,0.08)]',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#34322d] truncate">{model.name}</span>
                      {model.reasoning && (
                        <span className="shrink-0 rounded-full bg-[rgba(139,92,246,0.12)] px-1.5 py-0.5 text-[9px] font-semibold text-[#8b5cf6]">
                          Reasoning
                        </span>
                      )}
                      {model.tool_call && (
                        <span className="shrink-0 rounded-full bg-[rgba(34,197,94,0.12)] px-1.5 py-0.5 text-[9px] font-semibold text-[#22c55e]">
                          Tools
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#858481] truncate mt-0.5">{model.id}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-[10px] text-[#858481]">
                        ctx: {formatContext(model.limit.context)}
                      </span>
                      <span className="text-[10px] text-[#858481]">
                        out: {formatContext(model.limit.output)}
                      </span>
                      {model.cost && (
                        <>
                          <span className="text-[10px] text-[#858481]">
                            in: {formatPrice(model.cost.input)}/M
                          </span>
                          <span className="text-[10px] text-[#858481]">
                            out: {formatPrice(model.cost.output)}/M
                          </span>
                        </>
                      )}
                      {model.modalities.input.length > 0 && (
                        <span className="text-[10px] text-[#858481]">
                          {model.modalities.input.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  {model.id === selectedModel && <Check className="size-4 shrink-0 text-[#ffc700] mt-1" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ModelDetails({ model }: { model: ModelsDevModel }) {
  return (
    <div className="rounded-[14px] border border-border bg-[#f9f9f9] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-[#34322d]">{model.name}</h4>
          <p className="text-[11px] text-[#858481] mt-0.5">{model.description}</p>
        </div>
        <div className="flex flex-wrap gap-1 shrink-0">
          {model.reasoning && (
            <span className="rounded-full bg-[rgba(139,92,246,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#8b5cf6]">
              Reasoning
            </span>
          )}
          {model.tool_call && (
            <span className="rounded-full bg-[rgba(34,197,94,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#22c55e]">
              Tools
            </span>
          )}
          {model.attachment && (
            <span className="rounded-full bg-[rgba(59,130,246,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#3b82f6]">
              Multimodal
            </span>
          )}
          {model.open_weights && (
            <span className="rounded-full bg-[rgba(249,115,22,0.12)] px-2 py-0.5 text-[10px] font-semibold text-[#f97316]">
              Open Weights
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-[10px] bg-white p-2.5 border border-border">
          <div className="text-[10px] text-[#858481] uppercase tracking-wider">Context Window</div>
          <div className="text-sm font-semibold text-[#34322d] mt-0.5">{formatContext(model.limit.context)} tokens</div>
        </div>
        <div className="rounded-[10px] bg-white p-2.5 border border-border">
          <div className="text-[10px] text-[#858481] uppercase tracking-wider">Max Output</div>
          <div className="text-sm font-semibold text-[#34322d] mt-0.5">{formatContext(model.limit.output)} tokens</div>
        </div>
        {model.cost && (
          <>
            <div className="rounded-[10px] bg-white p-2.5 border border-border">
              <div className="text-[10px] text-[#858481] uppercase tracking-wider">Input Price</div>
              <div className="text-sm font-semibold text-[#34322d] mt-0.5">{formatPrice(model.cost.input)} / 1M tokens</div>
            </div>
            <div className="rounded-[10px] bg-white p-2.5 border border-border">
              <div className="text-[10px] text-[#858481] uppercase tracking-wider">Output Price</div>
              <div className="text-sm font-semibold text-[#34322d] mt-0.5">{formatPrice(model.cost.output)} / 1M tokens</div>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] text-[#858481]">
        <span>Input: {model.modalities.input.join(', ')}</span>
        <span>·</span>
        <span>Output: {model.modalities.output.join(', ')}</span>
        {model.family && (
          <>
            <span>·</span>
            <span>Family: {model.family}</span>
          </>
        )}
        {model.knowledge && (
          <>
            <span>·</span>
            <span>Knowledge: {model.knowledge}</span>
          </>
        )}
      </div>
    </div>
  )
}

export function ModelsTab() {
  const {
    providerKeys,
    providerBaseUrls,
    selectedProvider,
    selectedModel,
    setProviderKey,
    setProviderBaseUrl,
    setSelectedProvider,
    setSelectedModel,
  } = useSettingsStore()
  const { catalog, providers, models, loading, error, refresh } = useProviders()

  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const currentApiKey = providerKeys[selectedProvider] ?? ''
  const currentBaseUrl = providerBaseUrls[selectedProvider] ?? ''
  const selectedModelData = models.find((m) => m.id === selectedModel)

  const handleProviderSelect = useCallback(
    (providerId: string) => {
      setSelectedProvider(providerId)
      setSelectedModel('')
      setTestResult(null)
    },
    [setSelectedProvider, setSelectedModel],
  )

  const handleModelSelect = useCallback(
    (modelId: string) => {
      setSelectedModel(modelId)
    },
    [setSelectedModel],
  )

  const handleTestConnection = useCallback(async () => {
    if (!currentApiKey || !selectedModel) return
    setTesting(true)
    setTestResult(null)
    try {
      const baseUrl = currentBaseUrl || catalog?.[selectedProvider]?.api
      const endpoint = `${(baseUrl ?? '').replace(/\/+$/, '')}/chat/completions`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
      })
      if (response.ok || response.status === 400) {
        setTestResult({ ok: true, message: 'Connection successful' })
      } else {
        const text = await response.text().catch(() => '')
        setTestResult({ ok: false, message: `HTTP ${response.status}: ${text.slice(0, 100)}` })
      }
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Connection failed' })
    } finally {
      setTesting(false)
    }
  }, [currentApiKey, currentBaseUrl, selectedModel, selectedProvider, catalog])

  useEffect(() => {
    if (!selectedModel && models.length > 0) {
      setSelectedModel(models[0].id)
    }
  }, [models, selectedModel, setSelectedModel])

  if (loading && !catalog) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[#ffc700]" />
        <span className="ml-3 text-sm text-[#858481]">Loading providers from models.dev...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Section
        kicker="Provider catalog"
        title="Select provider"
        description="Choose an AI provider from the models.dev catalog. Over 180 providers with 6000+ models available."
      >
        <ProviderSelector
          providers={providers}
          selectedProvider={selectedProvider}
          onSelect={handleProviderSelect}
        />

        {selectedProvider && catalog?.[selectedProvider] && (
          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#858481]">
            <span>NPM: {catalog[selectedProvider].npm}</span>
            {catalog[selectedProvider].env.length > 0 && (
              <>
                <span>·</span>
                <span>Env: {catalog[selectedProvider].env.join(', ')}</span>
              </>
            )}
            {catalog[selectedProvider].doc && (
              <>
                <span>·</span>
                <a
                  href={catalog[selectedProvider].doc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3b82f6] hover:underline"
                >
                  Docs
                </a>
              </>
            )}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-[14px] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)] p-3 text-sm text-[#ef4444]">
            {error}
          </div>
        )}
      </Section>

      <Section
        kicker="API key"
        title="Provider credentials"
        description="Enter your API key for the selected provider. Keys are stored locally in your browser and never sent to models.dev."
      >
        <div className="rounded-[18px] border border-border bg-[#f5f5f5] p-4">
          <div className="flex items-center gap-3 mb-3">
            <ProviderLogo providerId={selectedProvider} className="size-8 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#34322d]">
                {catalog?.[selectedProvider]?.name ?? selectedProvider}
              </div>
              {catalog?.[selectedProvider]?.env[0] && (
                <div className="text-[10px] text-[#858481]">
                  Expected: {catalog[selectedProvider].env[0]}
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <Key className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#858481]" />
            <input
              type={showKey ? 'text' : 'password'}
              value={currentApiKey}
              onChange={(e) => setProviderKey(selectedProvider, e.target.value)}
              placeholder={`${catalog?.[selectedProvider]?.name ?? selectedProvider} API key`}
              className={cn(inputClass, 'pl-9 pr-20')}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="grid size-7 place-items-center rounded-[8px] text-[#858481] transition-colors hover:bg-white hover:text-[#34322d]"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
              {currentApiKey && (
                <button
                  type="button"
                  onClick={() => setProviderKey(selectedProvider, '')}
                  className="grid size-7 place-items-center rounded-[8px] text-[#858481] transition-colors hover:bg-white hover:text-[#34322d]"
                  title="Clear key"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <input
              value={currentBaseUrl}
              onChange={(e) => setProviderBaseUrl(selectedProvider, e.target.value)}
              placeholder={catalog?.[selectedProvider]?.api || 'Base URL (optional)'}
              className={cn(inputClass, 'text-xs')}
            />
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={!currentApiKey || !selectedModel || testing}
              className="shrink-0 rounded-[12px] border border-border bg-white/60 px-3 py-3 text-xs font-semibold text-[#858481] transition-colors hover:bg-white hover:text-[#34322d] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? <Loader2 className="size-4 animate-spin" /> : 'Test'}
            </button>
          </div>

          {testResult && (
            <div
              className={cn(
                'mt-2 rounded-[10px] p-2 text-xs',
                testResult.ok
                  ? 'bg-[rgba(34,197,94,0.08)] text-[#22c55e] border border-[rgba(34,197,94,0.2)]'
                  : 'bg-[rgba(239,68,68,0.08)] text-[#ef4444] border border-[rgba(239,68,68,0.2)]',
              )}
            >
              {testResult.message}
            </div>
          )}
        </div>
      </Section>

      <Section
        kicker="Model selection"
        title="Select model"
        description="Choose which model to use. Models come directly from the models.dev catalog."
      >
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-[10px] border border-border bg-white/60 px-2.5 py-1.5 text-[11px] font-medium text-[#858481] transition-colors hover:bg-white hover:text-[#34322d] disabled:opacity-50"
          >
            <RefreshCcw className={cn('size-3', loading && 'animate-spin')} />
            Refresh catalog
          </button>
          <span className="text-[10px] text-[#858481]">{models.length} models available</span>
        </div>

        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onSelect={handleModelSelect}
        />

        {selectedModelData && (
          <div className="mt-4">
            <ModelDetails model={selectedModelData} />
          </div>
        )}

        {!selectedModel && models.length === 0 && (
          <p className="mt-3 text-[11px] text-[#858481]">
            Select a provider above to see available models.
          </p>
        )}
      </Section>
    </div>
  )
}
