import { LayoutGrid } from 'lucide-react'
import { SQUAD_COLORS, SQUAD_NAMES } from '../lib/utils'

export function Sidebar({ currentPage, currentSquad, onNavigate, onSignOut }) {
  return (
    <nav className="w-56 flex flex-col flex-shrink-0" style={{ background: '#0D4D47' }}>
      {/* Brand */}
      <div className="px-6 py-5 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <img
          src="https://cdn.prod.website-files.com/617123e41df66d0e7f6dbea7/61a7b46ff625c1d97f6924a0_Logo-mark.svg"
          alt="Nurture"
          className="w-[30px] h-[30px] mb-2.5"
        />
        <div className="font-serif text-white text-[19px]">nurture</div>
        <div className="text-[12px] mt-[3px] tracking-wider font-mono" style={{ color: 'rgba(186,223,219,0.45)' }}>
          squad capacity · v0.2
        </div>
      </div>

      {/* Overview nav */}
      <div className="text-[11px] font-medium tracking-[0.13em] uppercase px-6 pt-4 pb-1"
        style={{ color: 'rgba(186,223,219,0.35)' }}>
        Overview
      </div>
      <NavItem
        active={currentPage === 'dashboard'}
        onClick={() => onNavigate('dashboard')}
        icon={<LayoutGrid size={14} className="flex-shrink-0" style={{ opacity: 0.65 }} />}
      >
        Dashboard
      </NavItem>

      {/* Squads nav */}
      <div className="text-[11px] font-medium tracking-[0.13em] uppercase px-6 pt-4 pb-1"
        style={{ color: 'rgba(186,223,219,0.35)' }}>
        Squads
      </div>
      {SQUAD_NAMES.map(name => (
        <NavItem
          key={name}
          active={currentPage === 'roster' && currentSquad === name}
          onClick={() => onNavigate('roster', name)}
          icon={<span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: SQUAD_COLORS[name] }} />}
        >
          {name}
        </NavItem>
      ))}

      {/* Sign out */}
      <div className="mt-auto px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={onSignOut}
          className="text-[13px] font-mono transition-colors"
          style={{ color: 'rgba(186,223,219,0.4)' }}
          onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
          onMouseLeave={e => e.target.style.color = 'rgba(186,223,219,0.4)'}
        >
          sign out
        </button>
      </div>
    </nav>
  )
}

function NavItem({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-6 py-2.5 text-sm font-mono text-left w-full transition-all duration-150 border-l-2"
      style={{
        color: active ? '#fff' : 'rgba(255,255,255,0.5)',
        borderLeftColor: active ? '#E3492B' : 'transparent',
        background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent' } }}
    >
      {icon}
      {children}
    </button>
  )
}
