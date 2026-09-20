import type { Candidate } from './types'
import { escapeRegExp } from './utils'

// Terms that can leak protected attributes. Redacted in Blind Mode.
const GENDER_TERMS = [
  'he', 'him', 'his', 'she', 'her', 'hers', 'male', 'female', 'man', 'woman',
  'mr', 'mrs', 'ms', 'gentleman', 'lady',
]

// A small list of well-known universities to neutralize "prestige" signals.
const PRESTIGE_SCHOOLS = [
  'harvard', 'stanford', 'mit', 'oxford', 'cambridge', 'yale', 'princeton',
  'berkeley', 'caltech', 'iit', 'nit', 'bits', 'carnegie mellon', 'cmu',
]

export interface BlindResult {
  displayName: string
  text: string
  redactions: number
}

/**
 * Produce a blinded view of a candidate: neutral display name and a redacted
 * resume text that removes name, gendered language, age, and school prestige.
 */
export function blindCandidate(candidate: Candidate, index: number): BlindResult {
  let text = candidate.rawText
  let redactions = 0

  const redact = (re: RegExp, label: string) => {
    text = text.replace(re, () => {
      redactions++
      return label
    })
  }

  // 1. Name (first token of full name, and full name)
  const nameParts = candidate.name.split(/\s+/).filter(Boolean)
  for (const part of nameParts) {
    if (part.length < 2) continue
    redact(new RegExp(`\\b${escapeRegExp(part)}\\b`, 'gi'), '[NAME]')
  }

  // 2. Gendered pronouns / titles
  redact(new RegExp(`\\b(${GENDER_TERMS.map(escapeRegExp).join('|')})\\b`, 'gi'), '[—]')

  // 3. Age / graduation years that reveal age
  redact(/\b(19[5-9]\d|20[0-1]\d)\b/g, '[YEAR]')
  redact(/\b\d{1,2}\s*(years old|yo)\b/gi, '[AGE]')

  // 4. Prestige schools
  redact(new RegExp(`\\b(${PRESTIGE_SCHOOLS.map(escapeRegExp).join('|')})\\b`, 'gi'), '[SCHOOL]')

  return {
    displayName: `Candidate #${String(index + 1).padStart(2, '0')}`,
    text,
    redactions,
  }
}

/** Returns a candidate object with blinded name + text (profile stays intact). */
export function toBlindCandidate(candidate: Candidate, index: number): Candidate {
  const b = blindCandidate(candidate, index)
  return {
    ...candidate,
    name: b.displayName,
    rawText: b.text,
    meta: undefined,
  }
}
