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

export const TIER_ORDER = ['active_oversight', 'coach', 'empower', 'monitor']

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

export const allocColor = (pct) => {
  if (pct > 100) return '#E3492B'
  if (pct === 100) return '#1B998B'
  if (pct >= 50)  return '#0D3764'
  return '#BADFDB'
}
