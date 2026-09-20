import type { AgentProvider } from '@/lib/types'
import { demoProvider } from './demo'
import { createLiveProvider, DEFAULT_MODEL, MODEL_OPTIONS } from './claude'
import { createMlProvider, DEFAULT_ML_URL, pingMlBackend } from './mlProvider'

export interface ProviderSettings {
  useMl: boolean
  mlApiUrl: string
  useLive: boolean
  apiKey: string
  model: string
}

/**
 * Returns the active agent provider by priority:
 *   Python ML backend  →  live Claude  →  local Demo engine.
 * Each higher tier gracefully degrades to the local engine on error.
 */
export function getProvider(settings: ProviderSettings): AgentProvider {
  if (settings.useMl) {
    return createMlProvider(settings.mlApiUrl || DEFAULT_ML_URL)
  }
  if (settings.useLive && settings.apiKey.trim()) {
    return createLiveProvider(settings.apiKey.trim(), settings.model || DEFAULT_MODEL)
  }
  return demoProvider
}

export { demoProvider, createLiveProvider, createMlProvider, pingMlBackend, DEFAULT_MODEL, MODEL_OPTIONS, DEFAULT_ML_URL }
