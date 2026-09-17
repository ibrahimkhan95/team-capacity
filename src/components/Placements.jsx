import { useState } from 'react'
import { Plus, Search, Link2, Check, MoveRight } from 'lucide-react'
import {
  PLACEMENT_STAGES, PLACEMENT_STAGE_LABELS, PLACEMENT_STAGE_COLORS,
  PLACEMENT_STAGE_ICONS, placementShareUrl, copyToClipboard, formatDate,
} from '../lib/utils'
import { showToast } from './Toast'
import { PlacementDrawer } from './PlacementDrawer'

// Placements are anchored to projects, so this is the entry point — the
// designer usually isn't known when one starts.
export function Placements({ placements = [], projects = [], members = [], onRefresh }) {
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('all')
  const [editing, setEditing] = useState(null) // null = closed, 'new' = creating, {...} = editing
  const [copiedId, setCopiedId] = useState(null)

  async function copyShareLink(placement, e) {
    e.stopPropagation()
    const ok = await copyToClipboard(placementShareUrl(placement.share_token))
    if (!ok) { showToast('could not copy — open the placement to get the link'); return }
    showToast('share link copied')
    setCopiedId(placement.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  const q = search.toLowerCase()
  const filtered = placements.filter(p => {
    const matchesStage = filter === 'all' || p.stage === filter
    const matchesQuery = !q ||
      (p.project_name || '').toLowerCase().includes(q) ||
      (p.member_name || '').toLowerCase().includes(q)
    return matchesStage && matchesQuery
  })

  const unassigned = placements.filter(p => !p.member_id).length

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-[28px] font-normal text-nb leading-tight">Placements</h1>
          <p className="text-[12px] mt-1 tracking-wider font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
            {placements.length} in flight
            {unassigned > 0 && ` · ${unassigned} awaiting a designer`}
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="inline-flex items-center gap-1.5 text-sm font-mono px-4 py-2 border-2 bg-no text-white cursor-pointer transition-all lowercase"
          style={{ borderColor: '#0D3764' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          <Plus size={13} strokeWidth={2} />
          start placement
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-[260px]">
          <Search size={13} strokeWidth={1.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(13,55,100,0.60)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="search placements..."
            className="w-full pl-8 pr-3 py-2 text-sm font-mono text-nb outline-none transition-colors border-2"
            style={{ background: '#FFFFFF', borderColor: '#0D3764' }}
            onFocus={e => e.target.style.borderColor = '#E3492B'}
            onBlur={e => e.target.style.borderColor = '#0D3764'}
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {[['all', 'all'], ...PLACEMENT_STAGES.map(s => [s, PLACEMENT_STAGE_LABELS[s].toLowerCase()])].map(([val, label]) => (
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
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="bg-sur border-2 overflow-hidden min-w-[720px]" style={{ borderColor: '#0D3764' }}>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="th">project</th>
                <th className="th">designer</th>
                <th className="th">stage</th>
                <th className="th">onboarding</th>
                <th className="th">share</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
                    {placements.length ? 'no placements match' : 'no placements yet — start one above'}
                  </td>
                </tr>
              ) : filtered.map(p => {
                const color = PLACEMENT_STAGE_COLORS[p.stage] || '#0D3764'
                const StageIcon = PLACEMENT_STAGE_ICONS[p.stage]
                const justCopied = copiedId === p.id
                return (
                  <tr key={p.id}
                    className="border-b cursor-pointer transition-colors"
                    style={{ borderColor: 'rgba(13,55,100,0.10)' }}
                    onClick={() => setEditing(p)}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(13,55,100,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td className="td font-medium text-nb">{p.project_name}</td>
                    <td className="td text-[13px]">
                      {p.member_name
                        ? <span style={{ color: '#0D3764' }}>{p.member_name}</span>
                        : <span className="lowercase" style={{ color: 'rgba(13,55,100,0.50)' }}>designer tbd</span>}
                    </td>
                    <td className="td">
                      <span className="inline-flex items-center justify-center gap-1.5 text-[12px] font-mono border-2 lowercase whitespace-nowrap"
                        style={{ height: 30, width: 180, borderColor: color, color }}>
                        {StageIcon && <StageIcon size={12} strokeWidth={2} className="flex-shrink-0" />}
                        {PLACEMENT_STAGE_LABELS[p.stage].toLowerCase()}
                      </span>
                    </td>
                    <td className="td text-[13px]" style={{ color: 'rgba(13,55,100,0.60)' }}>
                      {p.onboarding_date ? formatDate(p.onboarding_date) : '—'}
                    </td>
                    <td className="td" onClick={e => e.stopPropagation()}>
                      <button onClick={e => copyShareLink(p, e)}
                        title={justCopied ? 'link copied' : 'copy share link for the client'}
                        aria-label="copy share link"
                        className="inline-flex items-center justify-center border-2 cursor-pointer transition-all"
                        style={{
                          height: 30, width: 30,
                          borderColor: justCopied ? '#1B998B' : '#0D3764',
                          color: justCopied ? '#1B998B' : 'rgba(13,55,100,0.55)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                        {justCopied ? <Check size={12} strokeWidth={2.5} /> : <Link2 size={12} strokeWidth={2} />}
                      </button>
                    </td>
                    <td className="td">
                      <MoveRight size={13} strokeWidth={1.5} style={{ color: 'rgba(13,55,100,0.50)' }} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing !== null && (
        <PlacementDrawer
          key={editing === 'new' ? 'new' : editing.id}
          placement={editing === 'new' ? null : editing}
          projects={projects}
          allMembers={members}
          onClose={() => setEditing(null)}
          onRefresh={onRefresh}
          onSaved={() => { onRefresh(); setEditing(null) }}
        />
      )}

      <style>{`
        .th { font-size:11px; font-weight:500; color:rgba(13,55,100,0.60); letter-spacing:0.09em; padding:0.75rem 1rem; text-align:left; border-bottom:1px solid rgba(13,55,100,0.10); background:rgba(13,55,100,0.05); font-family:'Roboto Mono',monospace; }
        .td { padding:0.85rem 1rem; font-size:14px; color:#0D3764; vertical-align:middle; font-family:'Roboto Mono',monospace; }
      `}</style>
    </div>
  )
}
