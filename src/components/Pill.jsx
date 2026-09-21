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
      className="inline-flex items-center font-mono text-[12px] font-medium px-2.5 py-[3px] whitespace-nowrap"
      style={{ background: bg, color: text, ...(border ? { border: `1px solid ${border}` } : {}) }}
    >
      {children}
    </span>
  )
}

// Clickable chip for a designer on a placement — name plus the capacity they
// hold on that project. Opens their read-only detail view.
export function DesignerTag({ name, pct, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${name} — view details`}
      className="inline-flex items-center gap-1.5 font-mono text-[12px] font-medium px-2.5 py-[3px] whitespace-nowrap cursor-pointer transition-all"
      style={{ background: U.slate.bg, color: U.slate.text }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(100,116,139,0.20)'
        e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = U.slate.bg
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {name}
      {pct != null && (
        <span style={{ color: U.green.text }}>{pct}%</span>
      )}
    </button>
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
