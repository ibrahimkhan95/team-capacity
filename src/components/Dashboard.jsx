import { Users, CircleCheck, Clock, TrendingUp, Info } from 'lucide-react'

import { SQUAD_NAMES, SQUAD_COLORS, totalAlloc } from '../lib/utils'

export function Dashboard({ members, onNavigate }) {
  const onP   = members.filter(m => m.status === 'On Project')
  const bench = members.filter(m => m.status === 'Bench')
  const allocs = onP.map(m => Math.min(totalAlloc(m.assignments), 100))
  const avgAlloc = allocs.length ? Math.round(allocs.reduce((s, v) => s + v, 0) / allocs.length) : 0

  return (
    <div className="p-8 max-w-[1060px]">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="font-serif text-[28px] font-normal text-nb leading-tight">Overview</h1>
        <p className="text-[12px] mt-1 tracking-wider font-mono" style={{ color: 'rgba(13,55,100,0.42)' }}>
          all squads · live capacity summary
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <SummaryCard
          label="Total members" value={members.length} sub="across 3 squads"
          tooltip="Everyone in all squads, regardless of status."
          valueColor="#0D3764" iconBg="rgba(13,55,100,0.08)"
          icon={<Users size={18} color="#0D3764" strokeWidth={1.5} />} />
        <SummaryCard
          label="On project" value={onP.length}
          sub={`${members.length ? Math.round(onP.length / members.length * 100) : 0}% of team`}
          tooltip="Members actively assigned to a client or internal project."
          valueColor="#1B998B" iconBg="rgba(27,153,139,0.10)"
          icon={<CircleCheck size={18} color="#1B998B" strokeWidth={1.5} />} />
        <SummaryCard
          label="On bench" value={bench.length} sub="available now"
          tooltip="Members not on any project — available for new assignments."
          valueColor="#0A5950" iconBg="rgba(186,223,219,0.3)"
          icon={<Clock size={18} color="#0A5950" strokeWidth={1.5} />} />
        <SummaryCard
          label="Avg allocation" value={`${avgAlloc}%`} sub="on-project members"
          tooltip="Average workload of on-project members only. 100% means fully loaded, below means capacity to take on more."
          valueColor="#E3492B" iconBg="rgba(227,73,43,0.09)"
          icon={<TrendingUp size={18} color="#E3492B" strokeWidth={1.5} />} />
      </div>

      {/* Squad cards */}
      <h2 className="font-serif text-lg font-normal text-nb mb-4">Squads</h2>
      <div className="grid grid-cols-3 gap-4">
        {SQUAD_NAMES.map(name => {
          const squadMembers = members.filter(m => m.squad === name)
          const sp = squadMembers.filter(m => m.status === 'On Project')
          const sb = squadMembers.filter(m => m.status === 'Bench')
          const sa = sp.map(m => Math.min(totalAlloc(m.assignments), 100))
          const avgA = sa.length ? Math.round(sa.reduce((s, v) => s + v, 0) / sa.length) : 0
          const ac = SQUAD_COLORS[name]
          const bc = avgA === 100 ? '#1B998B' : avgA >= 50 ? '#0D3764' : '#BADFDB'
          return (
            <div
              key={name}
              onClick={() => onNavigate('roster', name)}
              className="bg-sur border rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 hover:-translate-y-px"
              style={{ borderColor: 'rgba(13,55,100,0.10)', boxShadow: '0 1px 3px rgba(13,55,100,0.08)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,55,100,0.12)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(13,55,100,0.08)'}
            >
              <div className="h-1" style={{ background: ac }} />
              <div className="px-7 py-6" style={{ borderBottom: '1px solid rgba(13,55,100,0.10)' }}>
                <h3 className="font-serif text-[22px] font-normal text-nb">{name}</h3>
                <small className="text-[12px] font-mono mt-1 block" style={{ color: 'rgba(13,55,100,0.42)' }}>
                  {squadMembers.length} members
                </small>
              </div>
              <div className="px-7 py-6 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.08em] font-mono mb-2" style={{ color: 'rgba(13,55,100,0.42)' }}>On project</div>
                  <div className="text-[36px] font-medium leading-none" style={{ color: '#1B998B' }}>{sp.length}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.08em] font-mono mb-2" style={{ color: 'rgba(13,55,100,0.42)' }}>Bench</div>
                  <div className="text-[36px] font-medium leading-none" style={{ color: '#0A5950' }}>{sb.length}</div>
                </div>
              </div>
              <div className="px-7 py-5" style={{ borderTop: '1px solid rgba(13,55,100,0.10)', background: 'rgba(13,55,100,0.03)' }}>
                <div className="flex justify-between text-[12px] font-mono mb-2" style={{ color: 'rgba(13,55,100,0.42)' }}>
                  <span>avg allocation · on project</span>
                  <span className="font-medium" style={{ color: bc }}>{avgA}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(13,55,100,0.10)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${avgA}%`, background: bc }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Tooltip({ text }) {
  return (
    <div className="relative group inline-flex items-center ml-1">
      <Info size={11} strokeWidth={1.5} style={{ color: 'rgba(13,55,100,0.28)', cursor: 'default' }} />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 pointer-events-none
                      opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        <div className="rounded-lg px-3 py-2 text-[11px] font-mono leading-relaxed"
          style={{ background: '#0D3764', color: 'rgba(255,255,255,0.88)', boxShadow: '0 4px 12px rgba(13,55,100,0.25)' }}>
          {text}
        </div>
        <div className="w-2 h-2 mx-auto -mt-1 rotate-45 rounded-sm" style={{ background: '#0D3764' }} />
      </div>
    </div>
  )
}

function SummaryCard({ label, tooltip, value, sub, valueColor, icon, iconBg }) {
  return (
    <div className="bg-sur border rounded-2xl p-7" style={{ borderColor: 'rgba(13,55,100,0.10)', boxShadow: '0 1px 3px rgba(13,55,100,0.08)' }}>
      <div className="flex items-center justify-between mb-5">
        <span className="inline-flex items-center text-[11px] font-medium uppercase tracking-[0.12em] font-mono" style={{ color: 'rgba(13,55,100,0.42)' }}>
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: iconBg }}>{icon}</div>
      </div>
      <div className="text-[44px] font-medium leading-none tracking-tight" style={{ color: valueColor }}>{value}</div>
      <div className="text-[12px] mt-3 font-mono" style={{ color: 'rgba(13,55,100,0.42)' }}>{sub}</div>
    </div>
  )
}
