import { useState } from 'react'
import { Search, Plus, ChevronLeft, ChevronRight, MoveRight } from 'lucide-react'
import { totalAlloc, PROJECT_COLORS } from '../lib/utils'
import { StatusPill, SeniorityPill, AllocPill } from './Pill'
import { MemberModal } from './MemberModal'

export function Roster({ squadName, members, onBack, onRefresh }) {
  const [filter, setFilter]   = useState('all')
  const [search, setSearch]   = useState('')
  const [expanded, setExpanded] = useState(new Set())
  const [editMember, setEditMember] = useState(null)   // null = closed, false = add new, obj = edit
  const [showModal, setShowModal] = useState(false)

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
      (m.assignments || []).some(a => a.project.toLowerCase().includes(q))
    return mf && ms
  })

  return (
    <div className="p-8 max-w-[1060px]">
      {/* Back */}
      <button onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13px] font-mono mb-5 transition-colors"
        style={{ color: 'rgba(13,55,100,0.42)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#0D3764'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,55,100,0.42)'}>
        <ChevronLeft size={14} strokeWidth={1.5} />
        back to dashboard
      </button>

      {/* Header */}
      <div className="mb-7">
        <h1 className="font-serif text-[28px] font-normal text-nb leading-tight">{squadName}</h1>
        <p className="text-[12px] mt-1 tracking-wider font-mono" style={{ color: 'rgba(13,55,100,0.42)' }}>
          {members.length} members · tap a row to edit · expand to see assignments
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-[260px]">
          <Search size={13} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(13,55,100,0.42)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search members..."
            className="w-full rounded-lg pl-8 pr-3 py-2 text-sm font-mono text-nb outline-none transition-colors"
            style={{ background: '#FFFFFF', border: '1px solid rgba(13,55,100,0.10)' }}
            onFocus={e => e.target.style.borderColor = '#E3492B'}
            onBlur={e => e.target.style.borderColor = 'rgba(13,55,100,0.10)'}
          />
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1.5">
          {[['all','all'],['On Project','on project'],['Bench','bench']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="text-[13px] font-mono px-3 py-1.5 rounded-lg border cursor-pointer transition-all"
              style={filter === val
                ? { background: 'rgba(227,73,43,0.10)', borderColor: 'rgba(227,73,43,0.25)', color: '#E3492B' }
                : { background: 'transparent', borderColor: 'rgba(13,55,100,0.10)', color: 'rgba(13,55,100,0.42)' }}>
              {label}
            </button>
          ))}
        </div>

        <button onClick={openAdd}
          className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium font-mono px-4 py-2 rounded-lg bg-no text-white cursor-pointer transition-opacity hover:opacity-90">
          <Plus size={13} strokeWidth={2} />
          add member
        </button>
      </div>

      {/* Table */}
      <div className="bg-sur border rounded-xl overflow-hidden"
        style={{ borderColor: 'rgba(13,55,100,0.10)', boxShadow: '0 1px 3px rgba(13,55,100,0.08)' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="th" style={{ width: 32 }}></th>
              <th className="th">Name</th>
              <th className="th">Seniority</th>
              <th className="th">Status</th>
              <th className="th">Projects</th>
              <th className="th">Total allocation</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {!filtered.length ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-sm font-mono" style={{ color: 'rgba(13,55,100,0.42)' }}>
                  no members found
                </td>
              </tr>
            ) : filtered.flatMap(m => {
              const alloc = totalAlloc(m.assignments)
              const isExp = expanded.has(m.id)
              const hasA  = (m.assignments || []).length > 0 && m.status !== 'Bench'
              const projectNames = m.status === 'Bench' ? '—' : (m.assignments || []).map(a => a.project).join(', ') || '—'

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
                        style={{ color: 'rgba(13,55,100,0.42)', transform: isExp ? 'rotate(90deg)' : 'none' }}>
                        <ChevronRight size={13} strokeWidth={2} />
                      </button>
                    )}
                  </td>
                  <td className="td font-medium text-nb">{m.name}</td>
                  <td className="td"><SeniorityPill seniority={m.seniority} /></td>
                  <td className="td"><StatusPill status={m.status} /></td>
                  <td className="td text-[13px]" style={{ color: 'rgba(13,55,100,0.42)' }}>{projectNames}</td>
                  <td className="td"><AllocPill pct={alloc} isBench={m.status === 'Bench'} /></td>
                  <td className="td">
                    <MoveRight size={13} strokeWidth={1.5} style={{ color: 'rgba(13,55,100,0.3)' }} />
                  </td>
                </tr>
              )

              const assignRows = isExp ? (m.assignments || []).map((a, idx) => {
                const dot = PROJECT_COLORS[idx % PROJECT_COLORS.length]
                return (
                  <tr key={`a-${m.id}-${idx}`} className="border-b" style={{ background: '#FAFBFD', borderColor: 'rgba(13,55,100,0.05)' }}>
                    <td></td>
                    <td colSpan={2} className="py-2 pl-10 text-[13px] font-mono" style={{ color: 'rgba(13,55,100,0.42)' }}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: dot }} />
                      {a.project}
                    </td>
                    <td className="py-2 text-[13px] font-mono" style={{ color: 'rgba(13,55,100,0.42)' }}>
                      <span className="inline-flex items-center font-mono text-[12px] font-medium px-2 py-[2px] rounded-full"
                        style={{ background: 'rgba(13,55,100,0.05)', color: 'rgba(13,55,100,0.42)' }}>
                        {a.engagement}
                      </span>
                    </td>
                    <td className="py-2 text-[13px] font-mono" style={{ color: 'rgba(13,55,100,0.42)' }}>
                      since {a.start_date || '—'}
                    </td>
                    <td colSpan={2} className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-[52px] h-1 rounded-full overflow-hidden" style={{ background: 'rgba(13,55,100,0.10)' }}>
                          <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: dot }} />
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

      {/* Modal */}
      {showModal && (
        <MemberModal
          member={editMember || undefined}
          squad={squadName}
          onClose={closeModal}
          onSaved={() => { onRefresh(); closeModal() }}
        />
      )}

      <style>{`
        .th { font-size:11px; font-weight:500; color:rgba(13,55,100,0.42); text-transform:uppercase; letter-spacing:0.09em; padding:0.75rem 1rem; text-align:left; border-bottom:1px solid rgba(13,55,100,0.10); background:rgba(13,55,100,0.05); font-family:'Roboto Mono',monospace; }
        .td { padding:0.85rem 1rem; font-size:14px; color:#0D3764; vertical-align:middle; font-family:'Roboto Mono',monospace; }
      `}</style>
    </div>
  )
}
