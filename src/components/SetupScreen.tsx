import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button, Card, CardContent, Textarea, Input, Badge } from './ui'
import { SAMPLE_JOB } from '@/data/sampleData'
import type { Candidate } from '@/lib/types'
import { uid } from '@/lib/utils'
import { Sparkles, Upload, Plus, Trash2, Eye, ShieldCheck, ScrollText, ListChecks, Play, Cloud, Clock, Trash } from 'lucide-react'

const FEATURES = [
  { icon: Eye, title: 'Glass-box scoring', desc: 'Every score cites the exact resume snippet behind it.' },
  { icon: ShieldCheck, title: 'Blind Mode', desc: 'Strip name, gender & school — see how the ranking shifts.' },
  { icon: ListChecks, title: 'Interview kits', desc: 'Auto-generated questions that probe real depth and gaps.' },
  { icon: ScrollText, title: 'Full audit trail', desc: 'Every AI insight is traceable back to its source.' },
]

interface Draft {
  id: string
  name: string
  text: string
}

export function SetupScreen() {
  const loadSample = useStore((s) => s.loadSample)
  const setInputs = useStore((s) => s.setInputs)
  const runScreening = useStore((s) => s.runScreening)
  const supabaseReady = useStore((s) => s.supabaseReady)
  const cloudScreenings = useStore((s) => s.cloudScreenings)
  const fetchCloudScreenings = useStore((s) => s.fetchCloudScreenings)
  const loadCloudScreening = useStore((s) => s.loadCloudScreening)
  const removeCloudScreening = useStore((s) => s.removeCloudScreening)

  useEffect(() => {
    if (supabaseReady) void fetchCloudScreenings()
  }, [supabaseReady, fetchCloudScreenings])

  const [jobText, setJobText] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [drafts, setDrafts] = useState<Draft[]>([{ id: uid('d'), name: '', text: '' }])

  const runSample = async () => {
    loadSample()
    await runScreening()
  }

  const addDraft = () => setDrafts((d) => [...d, { id: uid('d'), name: '', text: '' }])
  const removeDraft = (id: string) => setDrafts((d) => d.filter((x) => x.id !== id))
  const updateDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((d) => d.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const onUpload = async (files: FileList | null) => {
    if (!files) return
    const added: Draft[] = []
    for (const f of Array.from(files)) {
      const text = await f.text()
      added.push({ id: uid('d'), name: f.name.replace(/\.[^.]+$/, ''), text })
    }
    setDrafts((d) => [...d.filter((x) => x.text.trim()), ...added])
  }

  const canRun = jobText.trim().length > 20 && drafts.some((d) => d.text.trim().length > 20)

  const runManual = async () => {
    const candidates: Candidate[] = drafts
      .filter((d) => d.text.trim())
      .map((d, i) => ({ id: uid('c'), name: d.name.trim() || `Candidate ${i + 1}`, rawText: d.text.trim() }))
    setInputs({ id: uid('job'), title: jobTitle.trim() || 'Untitled role', rawText: jobText.trim() }, candidates)
    await runScreening()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Hero */}
      <div className="pt-6 text-center">
        <Badge className="mb-4"><Sparkles className="h-3 w-3" /> AI recruiting agent</Badge>
        <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          The AI screener that <span className="bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">shows its work</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Upload a job description and resumes. HireFlow builds an evidence-cited shortlist, writes interview
          kits, and reveals hiring bias — with a human in the loop the whole way.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={runSample}>
            <Play className="h-4 w-4" /> Load sample & run
          </Button>
          <span className="text-sm text-muted-foreground">10 resumes · 1 role · zero setup</span>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardContent className="p-4 pt-4">
              <f.icon className="mb-2 h-5 w-5 text-primary" />
              <div className="text-sm font-semibold">{f.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{f.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent screenings (Supabase) */}
      {supabaseReady && cloudScreenings.length > 0 && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Cloud className="h-4 w-4 text-primary" /> Recent screenings
              <Badge variant="success" className="ml-auto">Supabase connected</Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {cloudScreenings.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.title}</div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {new Date(s.created_at).toLocaleString()} · {s.candidate_count} candidates
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => loadCloudScreening(s.id)}>Open</Button>
                  <Button size="icon" variant="ghost" onClick={() => removeCloudScreening(s.id)}>
                    <Trash className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual entry */}
      <Card>
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Or screen your own</h2>
            <Button variant="ghost" size="sm" onClick={() => { setJobTitle(SAMPLE_JOB.title); setJobText(SAMPLE_JOB.rawText) }}>
              Use sample JD
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Job title</label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Backend Engineer" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Job description</label>
            <Textarea value={jobText} onChange={(e) => setJobText(e.target.value)} placeholder="Paste the full job description…" className="min-h-[120px]" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Candidates ({drafts.filter((d) => d.text.trim()).length})</label>
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-primary hover:underline">
                <Upload className="h-4 w-4" /> Upload .txt files
                <input type="file" accept=".txt,.md" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
              </label>
            </div>
            {drafts.map((d, i) => (
              <div key={d.id} className="rounded-lg border border-border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Input value={d.name} onChange={(e) => updateDraft(d.id, { name: e.target.value })} placeholder={`Candidate ${i + 1} name`} className="h-9" />
                  {drafts.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeDraft(d.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <Textarea value={d.text} onChange={(e) => updateDraft(d.id, { text: e.target.value })} placeholder="Paste resume text…" className="min-h-[80px]" />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addDraft}>
              <Plus className="h-4 w-4" /> Add candidate
            </Button>
          </div>

          <Button className="w-full" size="lg" disabled={!canRun} onClick={runManual}>
            <Play className="h-4 w-4" /> Screen candidates
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
