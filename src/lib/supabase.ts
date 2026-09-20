import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AuditEntry, Candidate, CandidateScore, Evaluation, InterviewKit, Job } from './types'

// Credentials come ONLY from environment variables — never hardcoded, never committed.
// Local: .env (gitignored). Production: Vercel env vars. If unset, the app runs
// fully local (no cloud persistence) and never leaks anything.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && key)

let _client: SupabaseClient | null = null
function client(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null
  if (!_client) _client = createClient(url!, key!, { auth: { persistSession: false } })
  return _client
}

/** Everything needed to restore a screening session. */
export interface ScreeningSnapshot {
  job: Job
  candidates: Candidate[]
  scores: Record<string, CandidateScore>
  blindScores: Record<string, CandidateScore>
  kits: Record<string, InterviewKit>
  evaluations: Record<string, Evaluation>
  audit: AuditEntry[]
}

export interface ScreeningRow {
  id: string
  title: string
  candidate_count: number
  created_at: string
}

export async function saveScreening(snapshot: ScreeningSnapshot): Promise<string | null> {
  const sb = client()
  if (!sb) return null
  const { data, error } = await sb
    .from('screenings')
    .insert({ title: snapshot.job.title, candidate_count: snapshot.candidates.length, data: snapshot })
    .select('id')
    .single()
  if (error) {
    console.warn('[supabase] save failed:', error.message)
    return null
  }
  return data?.id ?? null
}

export async function listScreenings(): Promise<ScreeningRow[]> {
  const sb = client()
  if (!sb) return []
  const { data, error } = await sb
    .from('screenings')
    .select('id,title,candidate_count,created_at')
    .order('created_at', { ascending: false })
    .limit(12)
  if (error) {
    console.warn('[supabase] list failed:', error.message)
    return []
  }
  return (data as ScreeningRow[]) ?? []
}

export async function loadScreening(id: string): Promise<ScreeningSnapshot | null> {
  const sb = client()
  if (!sb) return null
  const { data, error } = await sb.from('screenings').select('data').eq('id', id).single()
  if (error) {
    console.warn('[supabase] load failed:', error.message)
    return null
  }
  return (data?.data as ScreeningSnapshot) ?? null
}

export async function deleteScreening(id: string): Promise<void> {
  const sb = client()
  if (!sb) return
  const { error } = await sb.from('screenings').delete().eq('id', id)
  if (error) console.warn('[supabase] delete failed:', error.message)
}
