/**
 * Live / ML providers fall back to the local engine on any error so the app never
 * breaks. They record the first failure here so the UI can tell the user that the
 * results did not come from the engine they picked (e.g. an invalid API key).
 */
let pending: string | null = null

export function noteFallback(engine: string, e: unknown) {
  console.warn(`[${engine}] fell back to local engine:`, e)
  const msg = e instanceof Error ? e.message : String(e)
  if (!pending) pending = `${engine} failed (${msg.slice(0, 140)}) — results came from the local engine instead.`
}

export function takeFallback(): string | null {
  const p = pending
  pending = null
  return p
}
