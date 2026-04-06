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

// Converts YYYY-MM-DD to DD/MM/YYYY
export const formatDate = (d) => {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

export const totalAlloc = (assignments) =>
  (assignments || []).reduce((s, a) => s + (a.pct || 0), 0)

export const allocColor = (pct) => {
  if (pct > 100) return '#E3492B'
  if (pct === 100) return '#1B998B'
  if (pct >= 50)  return '#0D3764'
  return '#BADFDB'
}
