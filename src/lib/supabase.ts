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
  if (!_client) _client = createClient(url!, key!, { auth: { persistSession: true, autoRefreshToken: true } })
  return _client
}

/**
 * Screenings hold candidate personal data, so each row is owned by the signed-in
 * user and RLS only lets that user touch it (supabase/schema.sql). Each browser
 * gets its own private workspace through Supabase anonymous sign-in.
 */
let _user: Promise<string | null> | null = null
let _authError: string | null = null
export const getCloudAuthError = () => _authError

async function authed(): Promise<SupabaseClient | null> {
  const sb = client()
  if (!sb) return null
  if (!_user) {
    _user = (async () => {
      const { data } = await sb.auth.getSession()
      if (data.session?.user) return data.session.user.id
      const { data: signed, error } = await sb.auth.signInAnonymously()
      if (error || !signed.user) {
        console.warn('[supabase] anonymous sign-in failed:', error?.message)
        _authError =
          'Cloud save is off — enable "Allow anonymous sign-ins" in Supabase → Authentication → Sign In / Providers, then reload.'
        _user = null
        return null
      }
      _authError = null
      return signed.user.id
    })()
  }
  return (await _user) ? sb : null
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
  const sb = await authed()
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

/** Re-save after kits / evaluations are added, so reloading a screening keeps them. */
export async function updateScreening(id: string, snapshot: ScreeningSnapshot): Promise<void> {
  const sb = await authed()
  if (!sb) return
  const { error } = await sb.from('screenings').update({ data: snapshot }).eq('id', id)
  if (error) console.warn('[supabase] update failed:', error.message)
}

export async function listScreenings(): Promise<ScreeningRow[]> {
  const sb = await authed()
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
  const sb = await authed()
  if (!sb) return null
  const { data, error } = await sb.from('screenings').select('data').eq('id', id).single()
  if (error) {
    console.warn('[supabase] load failed:', error.message)
    return null
  }
  return (data?.data as ScreeningSnapshot) ?? null
}

export async function deleteScreening(id: string): Promise<boolean> {
  const sb = await authed()
  if (!sb) return false
  const { error } = await sb.from('screenings').delete().eq('id', id)
  if (error) {
    console.warn('[supabase] delete failed:', error.message)
    return false
  }
  return true
}
