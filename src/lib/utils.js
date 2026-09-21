import { FileText, Users, Phone, CalendarCheck } from 'lucide-react'

export const SQUAD_NAMES = ['Squad 1', 'Squad 2', 'Squad 3']

export const SQUAD_COLORS = {
  'Squad 1': '#E3492B',
  'Squad 2':  '#1B998B',
  'Squad 3':  '#B2D0FD',
}

export const PROJECT_COLORS = ['#E3492B','#1B998B','#B2D0FD','#BADFDB','#0D3764','#F5A623']

export const ENGAGEMENT_OPTIONS = [
  { label: 'Full Time (100%)', pct: 100 },
  { label: 'Part Time (75%)',  pct: 75  },
  { label: 'Part Time (50%)',  pct: 50  },
  { label: 'Part Time (25%)', pct: 25  },
]

export const TIER_ORDER = ['active_oversight', 'coach', 'monitor', 'empower']

export const TIER_LABELS = {
  active_oversight: 'Active Oversight',
  coach:            'Coach',
  empower:          'Empower',
  monitor:          'Monitor',
}

export const TIER_DESCRIPTIONS = {
  active_oversight: 'High energy. Multiple scheduled slots per week. Deep involvement.',
  coach:            'Requires structured 1:1s and specific milestone reviews.',
  empower:          'Low touch. Full delegation with intervention only on escalation.',
  monitor:          '15–30 min telemetry review & PM syncs. No direct intervention unless smoke is spotted.',
}

export const TIER_COLORS = {
  active_oversight: '#E3492B',
  coach:            '#0D3764',
  empower:          '#1B998B',
  monitor:          '#BADFDB',
}

// Accessible text colors — monitor uses a darker teal since #BADFDB is too light for text
export const TIER_TEXT_COLORS = {
  active_oversight: '#E3492B',
  coach:            '#0D3764',
  empower:          '#1B998B',
  monitor:          '#0A5950',
}

// Converts YYYY-MM-DD to DD/MM/YYYY for display
export const formatDate = (d) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// Converts DD/MM/YYYY input to YYYY-MM-DD for storage (only when complete)
export const parseDate = (d) => {
  if (!d) return ''
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return ''
  const [day, m, y] = d.split('/')
  return `${y}-${m}-${day}`
}

export const totalAlloc = (assignments) =>
  (assignments || []).reduce((s, a) => s + (a.pct || 0), 0)

// Designer placement pipeline — for new-project placements only, tracked
// separately from the existing member/assignment/project data.
export const PLACEMENT_STAGES = ['brief', 'squad_poc', 'intro_call', 'onboarding_set']

export const PLACEMENT_STAGE_LABELS = {
  brief:          'Design brief filled',
  squad_poc:      'Squad & POC decided',
  intro_call:     'Initial call held',
  onboarding_set: 'Onboarding date set',
}

// A distinct icon per stage so rows are scannable without reading the label.
// Lives here rather than in a component because both the roster and the
// placements page render stage chips.
export const PLACEMENT_STAGE_ICONS = {
  brief:          FileText,
  squad_poc:      Users,
  intro_call:     Phone,
  onboarding_set: CalendarCheck,
}

// One colour per stage so progress is readable at a glance in the roster.
// All are dark enough to sit as 2px border + text on a white row.
export const PLACEMENT_STAGE_COLORS = {
  brief:          '#0D3764', // navy — just kicked off
  squad_poc:      '#5B21B6', // violet — matches the XDM seniority pill
  intro_call:     '#E3492B', // brand orange — actively in motion
  onboarding_set: '#1B998B', // brand green — landed
}

export const PLACEMENT_STAGE_DESCRIPTIONS = {
  brief:          'Design brief created for this placement.',
  squad_poc:      'XDM head of design has decided the squad and point of contact.',
  intro_call:     'Initial call held with the Arbisoft contact — timeline and info gathered.',
  onboarding_set: 'Onboarding date has been set for the designer.',
}

// A placement can carry several designers, each at their own capacity, and
// they may come from different squads. Older rows hold a single member_id, so
// normalise both shapes to one array rather than branching at every call site.
export function placementDesigners(placement) {
  if (Array.isArray(placement?.designers) && placement.designers.length) {
    return placement.designers
  }
  if (placement?.member_id) {
    return [{
      member_id:   placement.member_id,
      member_name: placement.member_name || '',
      squad:       placement.squad || '',
      pct:         100,
      engagement:  'Full Time (100%)',
    }]
  }
  return []
}

// Short label for a designer list — "Bilal Aslam 50% · Faisal Khan 100%".
export function designersSummary(designers) {
  if (!designers?.length) return ''
  return designers.map(d => `${d.member_name} ${d.pct}%`).join(' · ')
}

export const placementStageIndex = (stage) => {
  const i = PLACEMENT_STAGES.indexOf(stage)
  return i === -1 ? 0 : i
}

export const placementShareUrl = (token) =>
  `${window.location.origin}/?pipeline=${token}`

// Google blocks framing of the /edit view (X-Frame-Options), but /preview is
// designed to be embedded. Pull the doc id out of whatever URL was pasted and
// rebuild it as a preview link. Returns null for anything unrecognised.
export function googleDocPreviewUrl(url) {
  if (!url) return null
  const m = String(url).match(/\/d\/([a-zA-Z0-9_-]{20,})/)
  if (!m) return null
  return `https://docs.google.com/document/d/${m[1]}/preview`
}

// The async Clipboard API rejects when the document isn't focused or the
// permission is denied, so fall back to the legacy path rather than failing
// silently. Returns whether the copy actually landed.
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

export const allocColor = (pct) => {
  if (pct > 100) return '#E3492B'
  if (pct === 100) return '#1B998B'
  if (pct >= 50)  return '#0D3764'
  return '#BADFDB'
}
