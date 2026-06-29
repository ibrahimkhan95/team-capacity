import { X, LayoutGrid, Briefcase } from 'lucide-react'
import { SQUAD_COLORS, SQUAD_NAMES } from '../lib/utils'

export function Sidebar({ currentPage, currentSquad, onNavigate, onSignOut, isOpen, onClose }) {
  function handleNavigate(target, squad) {
    onNavigate(target, squad)
    onClose?.()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[90] md:hidden"
          style={{ background: 'rgba(13,55,100,0.4)' }}
          onClick={onClose}
        />
      )}

      <nav
        className={`fixed md:relative inset-y-0 left-0 z-[100] md:z-auto w-56 min-h-screen flex flex-col flex-shrink-0 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: '#0D3764' }}
      >
        {/* Brand */}
        <div className="px-6 py-5 pb-5 flex items-start justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
          <div>
            <img
              src="https://cdn.prod.website-files.com/617123e41df66d0e7f6dbea7/61a7b46ff625c1d97f6924a0_Logo-mark.svg"
              alt="Nurture"
              className="w-[30px] h-[30px] mb-2.5"
            />
            <div className="font-serif text-white text-[19px]">nurture</div>
            <div className="text-[12px] mt-[3px] tracking-wider font-mono lowercase" style={{ color: 'rgba(186,223,219,0.55)' }}>
              squad capacity · v0.2
            </div>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={onClose}
            className="md:hidden mt-1 transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Overview nav */}
        <div className="text-[11px] tracking-[0.13em] px-6 pt-4 pb-1 lowercase font-mono"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          overview
        </div>
        <NavItem
          active={currentPage === 'dashboard'}
          onClick={() => handleNavigate('dashboard')}
          icon={<LayoutGrid size={14} className="flex-shrink-0" style={{ opacity: 0.65 }} />}
        >
          dashboard
        </NavItem>
        <NavItem
          active={currentPage === 'accounts'}
          onClick={() => handleNavigate('accounts')}
          icon={<Briefcase size={14} className="flex-shrink-0" style={{ opacity: 0.65 }} />}
        >
          accounts
        </NavItem>

        {/* Squads nav */}
        <div className="text-[11px] tracking-[0.13em] px-6 pt-4 pb-1 lowercase font-mono"
          style={{ color: 'rgba(255,255,255,0.35)' }}>
          squads
        </div>
        {SQUAD_NAMES.map(name => (
          <NavItem
            key={name}
            active={currentPage === 'roster' && currentSquad === name}
            onClick={() => handleNavigate('roster', name)}
            icon={<span className="w-[7px] h-[7px] flex-shrink-0" style={{ background: SQUAD_COLORS[name] }} />}
          >
            {name.toLowerCase()}
          </NavItem>
        ))}

        {/* Sign out */}
        <div className="mt-auto px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <button
            onClick={onSignOut}
            className="text-[13px] font-mono lowercase transition-colors"
            style={{ color: 'rgba(255,255,255,0.35)' }}
            onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
          >
            sign out
          </button>
        </div>
      </nav>
    </>
  )
}

function NavItem({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-6 py-2.5 text-sm font-mono text-left w-full transition-all duration-150 border-l-2 lowercase"
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
