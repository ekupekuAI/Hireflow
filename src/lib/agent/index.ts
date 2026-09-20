import type { AgentProvider } from '@/lib/types'
import { demoProvider } from './demo'
import { createLiveProvider, DEFAULT_MODEL, MODEL_OPTIONS } from './claude'

export interface ProviderSettings {
  useLive: boolean
  apiKey: string
  model: string
}

/**
 * Returns the active agent provider. Live mode requires an API key; otherwise we
 * transparently use the local Demo engine (which also works for any uploaded resume).
 */
export function getProvider(settings: ProviderSettings): AgentProvider {
  if (settings.useLive && settings.apiKey.trim()) {
    return createLiveProvider(settings.apiKey.trim(), settings.model || DEFAULT_MODEL)
  }
  return demoProvider
}

export { demoProvider, createLiveProvider, DEFAULT_MODEL, MODEL_OPTIONS }
