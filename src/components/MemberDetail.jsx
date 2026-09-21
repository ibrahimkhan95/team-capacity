import { useEffect } from 'react'
import { X, ChevronRight } from 'lucide-react'
import {
  totalAlloc, formatDate, PROJECT_COLORS,
  PLACEMENT_STAGE_LABELS, PLACEMENT_STAGE_COLORS, PLACEMENT_STAGE_ICONS,
  placementDesigners,
} from '../lib/utils'
import { StatusPill, SeniorityPill, AllocPill } from './Pill'

// Read-only view of a designer — opened from a designer tag. Deliberately not
// editable: editing a member belongs on their squad roster, this is for
// checking what else someone is on before committing them to a placement.
export function MemberDetail({ member, placements = [], onClose, zIndex = 130 }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const assignments = member.assignments || []
  const alloc = totalAlloc(assignments)
  const free = Math.max(0, 100 - alloc)

  // Every placement this person is part of, at whatever capacity.
  const theirPlacements = placements
    .map(p => {
      const seat = placementDesigners(p).find(d => d.member_id === member.id)
      return seat ? { placement: p, pct: seat.pct } : null
    })
    .filter(Boolean)

  return (
    <div className="fixed inset-0 flex justify-end" style={{ zIndex }}>
      <div className="absolute inset-0" style={{ background: 'rgba(13,55,100,0.25)' }} onClick={onClose} />

      <div className="relative flex flex-col bg-sur h-full w-full md:w-[420px]"
        style={{ borderLeft: '2px solid #0D3764' }}>

        {/* Header */}
        <div className="flex justify-between items-start px-6 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(13,55,100,0.10)', background: 'rgba(13,55,100,0.03)' }}>
          <div>
            <h2 className="font-serif text-[20px] font-normal text-nb leading-none">{member.name}</h2>
            <p className="text-[11px] font-mono mt-1 lowercase" style={{ color: 'rgba(13,55,100,0.60)' }}>
              {member.squad} · read only
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 transition-colors"
            style={{ color: 'rgba(13,55,100,0.60)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#0D3764'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,55,100,0.60)'}>
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {/* At a glance */}
          <div className="flex flex-wrap items-center gap-1.5">
            <SeniorityPill seniority={member.seniority} />
            <StatusPill status={member.status} />
          </div>

          <SectionLabel>capacity</SectionLabel>
          <div className="flex flex-wrap items-center gap-1.5">
            <AllocPill pct={alloc} isBench={member.status === 'Bench'} />
          </div>

          {/* Simple utilisation bar — quicker to read than the numbers alone. */}
          <div className="flex flex-col gap-1.5">
            <div className="w-full h-2.5 overflow-hidden" style={{ background: 'rgba(13,55,100,0.10)' }}>
              <div className="h-full transition-all"
                style={{
                  width: `${Math.min(alloc, 100)}%`,
                  background: alloc > 100 ? '#E3492B' : alloc === 100 ? '#1B998B' : '#0D3764',
                }} />
            </div>
            <span className="text-[11px] font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
              {alloc}% allocated{free > 0 ? ` · ${free}% free` : ''}
            </span>
          </div>

          {/* Current project assignments */}
          <SectionLabel>project assignments</SectionLabel>
          {assignments.length === 0 ? (
            <p className="text-[12px] font-mono" style={{ color: 'rgba(13,55,100,0.50)' }}>
              not assigned to any project.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {assignments.map((a, i) => {
                const dot = PROJECT_COLORS[i % PROJECT_COLORS.length]
                return (
                  <div key={a.id || i} className="p-3 border-2"
                    style={{ background: '#F5F0E3', borderColor: '#0D3764' }}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="flex items-center gap-1.5 text-[13px] font-mono" style={{ color: '#0D3764' }}>
                        <span className="inline-block w-1.5 h-1.5 flex-shrink-0" style={{ background: dot }} />
                        {a.project_info?.name || a.project || '—'}
                      </span>
                      <span className="text-[12px] font-mono font-medium flex-shrink-0" style={{ color: dot }}>
                        {a.pct}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono"
                      style={{ color: 'rgba(13,55,100,0.60)' }}>
                      <span>{a.engagement}</span>
                      {a.start_date && <span>since {formatDate(a.start_date)}</span>}
                    </div>
                    {a.notes && (
                      <p className="text-[11px] font-mono mt-2 leading-relaxed" style={{ color: 'rgba(13,55,100,0.60)' }}>
                        {a.notes}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Placements they're part of */}
          <SectionLabel>in placement pipeline</SectionLabel>
          {theirPlacements.length === 0 ? (
            <p className="text-[12px] font-mono" style={{ color: 'rgba(13,55,100,0.50)' }}>
              not part of any placement.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {theirPlacements.map(({ placement, pct }) => {
                const color = PLACEMENT_STAGE_COLORS[placement.stage] || '#0D3764'
                const StageIcon = PLACEMENT_STAGE_ICONS[placement.stage]
                return (
                  <div key={placement.id} className="flex items-center gap-2 p-3 border-2"
                    style={{ borderColor: 'rgba(13,55,100,0.15)', background: '#FFFFFF' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-mono truncate" style={{ color: '#0D3764' }}>
                        {placement.project_name}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono lowercase mt-1"
                        style={{ color }}>
                        {StageIcon && <StageIcon size={11} strokeWidth={2} />}
                        {PLACEMENT_STAGE_LABELS[placement.stage].toLowerCase()}
                      </span>
                    </div>
                    <span className="text-[12px] font-mono font-medium flex-shrink-0" style={{ color: '#1B998B' }}>
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {member.notes && (
            <>
              <SectionLabel>notes</SectionLabel>
              <p className="text-[12px] font-mono leading-relaxed whitespace-pre-wrap" style={{ color: '#0D3764' }}>
                {member.notes}
              </p>
            </>
          )}
        </div>

        <div className="px-6 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(13,55,100,0.10)', background: 'rgba(13,55,100,0.02)' }}>
          <p className="text-[11px] font-mono lowercase" style={{ color: 'rgba(13,55,100,0.50)' }}>
            <ChevronRight size={11} strokeWidth={2} className="inline mb-[1px]" />
            {' '}edit this member from their squad roster
          </p>
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-medium tracking-[0.10em] font-mono pb-2 lowercase"
      style={{ color: 'rgba(13,55,100,0.60)', borderBottom: '1px solid rgba(13,55,100,0.10)' }}>
      {children}
    </div>
  )
}
