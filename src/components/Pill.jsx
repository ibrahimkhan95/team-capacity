// Utility color palette — semantic only, separate from brand accent colors
const U = {
  green:  { bg: 'rgba(34,197,94,0.10)',   text: '#15803D' },
  amber:  { bg: 'rgba(245,158,11,0.10)',  text: '#92400E' },
  indigo: { bg: 'rgba(99,102,241,0.10)',  text: '#3730A3' },
  rose:   { bg: 'rgba(244,63,94,0.10)',   text: '#BE123C' },
  violet: { bg: 'rgba(139,92,246,0.10)',  text: '#5B21B6' },
  slate:  { bg: 'rgba(100,116,139,0.10)', text: '#334155' },
  red:    { bg: 'rgba(239,68,68,0.10)',   text: '#B91C1C', border: 'rgba(239,68,68,0.25)' },
}

function Chip({ bg, text, border, children }) {
  return (
    <span
      className="inline-flex items-center font-mono text-[12px] font-medium px-2.5 py-[3px] rounded-full whitespace-nowrap"
      style={{ background: bg, color: text, ...(border ? { border: `1px solid ${border}` } : {}) }}
    >
      {children}
    </span>
  )
}

export function StatusPill({ status }) {
  const map = {
    'On Project': { ...U.green,  label: 'on project' },
    'Bench':      { ...U.amber,  label: 'bench' },
    'On Leave':   { ...U.indigo, label: 'on leave' },
    'Exiting':    { ...U.rose,   label: 'exiting' },
  }
  const s = map[status] || { ...U.slate, label: status?.toLowerCase() }
  return <Chip {...s}>{s.label}</Chip>
}

export function SeniorityPill({ seniority }) {
  const map = {
    XDM:    U.violet,
    Senior: U.slate,
    Mid:    U.slate,
    Junior: U.slate,
  }
  const s = map[seniority] || U.slate
  return <Chip {...s}>{seniority?.toLowerCase()}</Chip>
}

export function AllocPill({ pct, isBench }) {
  if (isBench) return (
    <span className="flex items-center gap-1.5 flex-wrap">
      <Chip {...U.slate}>0% allocated</Chip>
      <Chip {...U.slate}>100% free</Chip>
    </span>
  )
  if (pct > 100) return (
    <Chip {...U.red} border={U.red.border}>⚠ {pct}% over-allocated</Chip>
  )
  if (pct === 0) return <Chip {...U.slate}>—</Chip>

  const avail = 100 - pct
  return (
    <span className="flex items-center gap-1.5 flex-wrap">
      <Chip {...U.green}>{pct}% allocated</Chip>
      {avail > 0 && <Chip {...U.slate}>{avail}% free</Chip>}
    </span>
  )
}
