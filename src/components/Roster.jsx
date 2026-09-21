import { useState } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, MoveRight, Link2, Check } from 'lucide-react'
import {
  totalAlloc, PROJECT_COLORS, formatDate, PLACEMENT_STAGE_LABELS,
  PLACEMENT_STAGE_COLORS, PLACEMENT_STAGE_ICONS, placementShareUrl, copyToClipboard,
  placementDesigners,
} from '../lib/utils'

// Fixed box so the chip matches the placements page — width fits the longest
// label ("onboarding date set") on one line, nowrap stops it wrapping.
const PLACEMENT_CHIP_H = 30
const placementChipCls =
  'inline-flex items-center justify-center gap-1.5 text-[12px] font-mono border-2 lowercase whitespace-nowrap'
const placementChipStyle = { height: PLACEMENT_CHIP_H, width: 180 }
import { StatusPill, SeniorityPill, AllocPill } from './Pill'
import { MemberModal } from './MemberModal'
import { showToast } from './Toast'

export function Roster({ squadName, members, projects = [], placements = [], onBack, onRefresh }) {
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [expanded, setExpanded] = useState(new Set())
  const [editMember, setEditMember] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [copiedId, setCopiedId] = useState(null) // placement whose share link was just copied

  // A placement can carry several designers, so match against the whole team
  // rather than the single member_id column.
  function activePlacementFor(memberId) {
    return placements.find(p =>
      placementDesigners(p).some(d => d.member_id === memberId))
  }

  async function copyShareLink(placement) {
    const ok = await copyToClipboard(placementShareUrl(placement.share_token))
    if (!ok) { showToast('could not copy — open the placement to get the link'); return }
    showToast('share link copied')
    setCopiedId(placement.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  function toggleExpand(id, e) {
    e.stopPropagation()
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openEdit(member) { setEditMember(member); setShowModal(true) }
  function openAdd()        { setEditMember(null);   setShowModal(true) }
  function closeModal()     { setShowModal(false) }

  const q = search.toLowerCase()
  const filtered = members.filter(m => {
    const mf = filter === 'all' || m.status === filter
    const ms = !q || m.name.toLowerCase().includes(q) ||
      (m.assignments || []).some(a => (a.project_info?.name || a.project || '').toLowerCase().includes(q))
    return mf && ms
  })

  return (
    <div className="p-4 md:p-8">
      {/* Back */}
      <button onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-mono mb-5 transition-colors lowercase"
        style={{ color: 'rgba(13,55,100,0.60)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#0D3764'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,55,100,0.60)'}>
        <ChevronLeft size={14} strokeWidth={1.5} />
        back to dashboard
      </button>

      {/* Header */}
      <div className="mb-7">
        <h1 className="font-serif text-[28px] font-normal text-nb leading-tight">{squadName}</h1>
        <p className="text-[12px] mt-1 tracking-wider font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
          {members.length} members · tap a row to edit · expand to see assignments
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-[260px]">
          <Search size={13} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(13,55,100,0.60)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search members..."
            className="w-full pl-8 pr-3 py-2 text-sm font-mono text-nb outline-none transition-colors border-2"
            style={{ background: '#FFFFFF', borderColor: '#0D3764' }}
            onFocus={e => e.target.style.borderColor = '#E3492B'}
            onBlur={e => e.target.style.borderColor = '#0D3764'}
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1.5">
          {[['all','all'],['On Project','on project'],['Bench','bench']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="text-[13px] font-mono px-3 py-1.5 border-2 cursor-pointer transition-all lowercase"
              style={filter === val
                ? { background: '#E3492B', borderColor: '#0D3764', color: '#FFFFFF', boxShadow: '2px 2px 0px #0D3764' }
                : { background: 'transparent', borderColor: '#0D3764', color: 'rgba(13,55,100,0.55)' }}
              onMouseEnter={e => { if (filter !== val) e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764' }}
              onMouseLeave={e => { if (filter !== val) e.currentTarget.style.boxShadow = 'none' }}>
              {label}
            </button>
          ))}
        </div>

        <button onClick={openAdd}
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-mono px-4 py-2 border-2 bg-no text-white cursor-pointer transition-all lowercase"
          style={{ borderColor: '#0D3764' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
          <Plus size={13} strokeWidth={2} />
          add member
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
      <div className="bg-sur border-2 overflow-hidden min-w-[640px]"
        style={{ borderColor: '#0D3764' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="th" style={{ width: 32 }}></th>
              <th className="th">name</th>
              <th className="th">seniority</th>
              <th className="th">status</th>
              <th className="th">projects</th>
              <th className="th">total allocation</th>
              <th className="th">placement</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {!filtered.length ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-sm font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
                  no members found
                </td>
              </tr>
            ) : filtered.flatMap(m => {
              const alloc = totalAlloc(m.assignments)
              const isExp = expanded.has(m.id)
              const hasA  = (m.assignments || []).length > 0 && m.status !== 'Bench'
              const projectNames = m.status === 'Bench' ? '—' : (m.assignments || []).map(a => a.project_info?.name || a.project).join(', ') || '—'
              const placement = activePlacementFor(m.id)

              const personRow = (
                <tr key={`p-${m.id}`}
                  className="border-b cursor-pointer transition-colors"
                  style={{ borderColor: 'rgba(13,55,100,0.10)', background: isExp ? 'rgba(13,55,100,0.05)' : undefined }}
                  onClick={() => openEdit(m)}
                  onMouseEnter={e => { if (!isExp) e.currentTarget.style.background = 'rgba(13,55,100,0.05)' }}
                  onMouseLeave={e => { if (!isExp) e.currentTarget.style.background = '' }}>
                  <td className="pl-4 py-3" onClick={e => { e.stopPropagation(); if (hasA) toggleExpand(m.id, e) }}>
                    {hasA && (
                      <button
                        onClick={e => toggleExpand(m.id, e)}
                        className="flex items-center transition-transform duration-150"
                        style={{ color: 'rgba(13,55,100,0.60)', transform: isExp ? 'rotate(90deg)' : 'none' }}>
                        <ChevronRight size={13} strokeWidth={2} />
                      </button>
                    )}
                  </td>
                  <td className="td font-medium text-nb">{m.name}</td>
                  <td className="td"><SeniorityPill seniority={m.seniority} /></td>
                  <td className="td"><StatusPill status={m.status} /></td>
                  <td className="td text-[13px]" style={{ color: 'rgba(13,55,100,0.60)' }}>{projectNames}</td>
                  <td className="td"><AllocPill pct={alloc} isBench={m.status === 'Bench'} /></td>
                  {/* Read-only status. Placements are started and edited from
                      the Placements page — they're anchored to a project, not
                      a designer, so they can't begin here. */}
                  <td className="td" onClick={e => e.stopPropagation()}>
                    {placement ? (() => {
                      const color = PLACEMENT_STAGE_COLORS[placement.stage] || '#0D3764'
                      const StageIcon = PLACEMENT_STAGE_ICONS[placement.stage]
                      const justCopied = copiedId === placement.id
                      return (
                        <div className="inline-flex items-center gap-1.5">
                          <span className={placementChipCls}
                            title={`${placement.project_name} — ${PLACEMENT_STAGE_LABELS[placement.stage].toLowerCase()}`}
                            style={{ ...placementChipStyle, borderColor: color, color }}>
                            {StageIcon && <StageIcon size={12} strokeWidth={2} className="flex-shrink-0" />}
                            {PLACEMENT_STAGE_LABELS[placement.stage].toLowerCase()}
                          </span>
                          <button onClick={() => copyShareLink(placement)}
                            title={justCopied ? 'link copied' : 'copy share link for the client'}
                            aria-label="copy share link"
                            className="inline-flex items-center justify-center border-2 cursor-pointer transition-all flex-shrink-0"
                            style={{
                              height: PLACEMENT_CHIP_H, width: PLACEMENT_CHIP_H,
                              borderColor: justCopied ? '#1B998B' : '#0D3764',
                              color: justCopied ? '#1B998B' : 'rgba(13,55,100,0.55)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                            {justCopied
                              ? <Check size={12} strokeWidth={2.5} />
                              : <Link2 size={12} strokeWidth={2} />}
                          </button>
                        </div>
                      )
                    })() : (
                      <span className="text-[13px] font-mono" style={{ color: 'rgba(13,55,100,0.35)' }}>—</span>
                    )}
                  </td>
                  <td className="td">
                    <MoveRight size={13} strokeWidth={1.5} style={{ color: 'rgba(13,55,100,0.50)' }} />
                  </td>
                </tr>
              )

              const assignRows = isExp ? (m.assignments || []).map((a, idx) => {
                const dot = PROJECT_COLORS[idx % PROJECT_COLORS.length]
                return (
                  <tr key={`a-${m.id}-${idx}`} className="border-b" style={{ background: '#E8E8E8', borderColor: 'rgba(13,55,100,0.08)' }}>
                    <td></td>
                    <td colSpan={2} className="py-2 pl-10 text-[13px] font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
                      <span className="inline-block w-1.5 h-1.5 mr-1.5 align-middle" style={{ background: dot }} />
                      {a.project_info?.name || a.project}
                    </td>
                    <td className="py-2 text-[13px] font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
                      <span className="inline-flex items-center font-mono text-[12px] font-medium px-2 py-[2px]"
                        style={{ background: 'rgba(13,55,100,0.05)', color: 'rgba(13,55,100,0.60)' }}>
                        {a.engagement}
                      </span>
                    </td>
                    <td className="py-2 text-[13px] font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
                      since {formatDate(a.start_date)}
                    </td>
                    <td colSpan={3} className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-[52px] h-2 overflow-hidden" style={{ background: 'rgba(13,55,100,0.10)' }}>
                          <div className="h-full" style={{ width: `${a.pct}%`, background: dot }} />
                        </div>
                        <span className="text-[12px] font-medium font-mono" style={{ color: dot }}>{a.pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              }) : []

              return [personRow, ...assignRows]
            })}
          </tbody>
        </table>
      </div>

      </div>{/* end overflow-x-auto */}

      {/* Modal */}
      {showModal && (
        <MemberModal
          member={editMember || undefined}
          squad={squadName}
          projects={projects}
          onClose={closeModal}
          onSaved={() => { onRefresh(); closeModal() }}
        />
      )}

      <style>{`
        .th { font-size:11px; font-weight:500; color:rgba(13,55,100,0.60); letter-spacing:0.09em; padding:0.75rem 1rem; text-align:left; border-bottom:1px solid rgba(13,55,100,0.10); background:rgba(13,55,100,0.05); font-family:'Roboto Mono',monospace; }
        .td { padding:0.85rem 1rem; font-size:14px; color:#0D3764; vertical-align:middle; font-family:'Roboto Mono',monospace; }
      `}</style>
    </div>
  )
}
