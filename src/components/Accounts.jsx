import { useState, useMemo, useEffect } from 'react'
import { Plus, ChevronDown, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  TIER_ORDER, TIER_LABELS, TIER_DESCRIPTIONS, TIER_COLORS, SQUAD_COLORS,
} from '../lib/utils'
import { showToast } from './Toast'

export function Accounts({ projects, members, session, onRefresh }) {
  const [showNewProject, setShowNewProject] = useState(false)
  const [changingTier, setChangingTier] = useState(null)

  // Which squads are on each project
  const squadsByProject = useMemo(() => {
    const map = {}
    for (const m of members) {
      for (const a of m.assignments || []) {
        const pid = a.project_id || a.project_info?.id
        if (!pid) continue
        if (!map[pid]) map[pid] = new Set()
        map[pid].add(m.squad)
      }
    }
    return map
  }, [members])

  // Projects grouped by tier
  const byTier = useMemo(() => {
    const groups = {}
    for (const t of TIER_ORDER) groups[t] = []
    for (const p of projects) {
      const key = TIER_ORDER.includes(p.tier) ? p.tier : 'monitor'
      groups[key].push(p)
    }
    return groups
  }, [projects])

  async function handleTierChange(project, newTier) {
    setChangingTier(null)
    if (project.tier === newTier) return
    try {
      const { error: uErr } = await supabase
        .from('projects')
        .update({ tier: newTier })
        .eq('id', project.id)
      if (uErr) throw uErr

      const { error: hErr } = await supabase
        .from('project_tier_history')
        .insert({
          project_id: project.id,
          from_tier: project.tier,
          to_tier: newTier,
          changed_by: session?.user?.email || '',
        })
      if (hErr) throw hErr

      showToast('tier updated')
      onRefresh()
    } catch (err) {
      showToast(err.message)
    }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-serif text-[28px] font-normal text-nb leading-tight">Accounts</h1>
          <p className="text-[12px] mt-1 tracking-wider font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
            {projects.length} projects · tiered account management
          </p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="inline-flex items-center gap-1.5 text-sm font-mono px-4 py-2 border-2 bg-no text-white cursor-pointer transition-all lowercase"
          style={{ borderColor: '#0D3764' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          <Plus size={13} strokeWidth={2} />
          new project
        </button>
      </div>

      {/* Tier sections */}
      <div className="flex flex-col gap-10">
        {TIER_ORDER.map(tier => (
          <TierSection
            key={tier}
            tier={tier}
            projects={byTier[tier]}
            squadsByProject={squadsByProject}
            changingTier={changingTier}
            onStartChange={pid => setChangingTier(pid)}
            onTierChange={handleTierChange}
            onCancelChange={() => setChangingTier(null)}
          />
        ))}
      </div>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onSaved={() => { onRefresh(); setShowNewProject(false) }}
        />
      )}
    </div>
  )
}

function TierSection({ tier, projects, squadsByProject, changingTier, onStartChange, onTierChange, onCancelChange }) {
  const color = TIER_COLORS[tier]
  const label = TIER_LABELS[tier]
  const desc  = TIER_DESCRIPTIONS[tier]

  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4 pb-3"
        style={{ borderBottom: `2px solid ${color}` }}>
        <h2 className="font-serif text-[20px] font-normal text-nb">{label}</h2>
        <span className="text-[12px] font-mono flex-1" style={{ color: 'rgba(13,55,100,0.55)' }}>{desc}</span>
        <span className="text-[11px] font-mono font-medium" style={{ color }}>
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      {projects.length === 0 ? (
        <p className="text-[13px] font-mono py-2" style={{ color: 'rgba(13,55,100,0.35)' }}>
          no projects in this tier
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              squads={[...(squadsByProject[project.id] || [])]}
              isChanging={changingTier === project.id}
              onStartChange={() => onStartChange(project.id)}
              onTierChange={newTier => onTierChange(project, newTier)}
              onCancelChange={onCancelChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, squads, isChanging, onStartChange, onTierChange, onCancelChange }) {
  const tierColor = TIER_COLORS[project.tier] || TIER_COLORS.monitor

  return (
    <div className="bg-sur border-2 p-4" style={{ borderColor: '#0D3764' }}>
      <p className="font-serif text-[16px] text-nb leading-tight mb-3">{project.name}</p>

      {/* Squad indicators */}
      <div className="flex items-center gap-2 mb-4 min-h-[18px]">
        {squads.length === 0 ? (
          <span className="text-[11px] font-mono" style={{ color: 'rgba(13,55,100,0.30)' }}>no assignments</span>
        ) : squads.sort().map(squad => (
          <div key={squad} className="flex items-center gap-1">
            <span className="w-2 h-2 inline-block flex-shrink-0" style={{ background: SQUAD_COLORS[squad] }} />
            <span className="text-[11px] font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
              {squad.replace('Squad ', 'S')}
            </span>
          </div>
        ))}
      </div>

      {/* Tier badge / picker */}
      {isChanging ? (
        <select
          autoFocus
          defaultValue={project.tier}
          onChange={e => onTierChange(e.target.value)}
          onBlur={onCancelChange}
          className="w-full text-[11px] font-mono border-2 px-2 py-1.5 outline-none"
          style={{ borderColor: '#E3492B', background: '#FFFFFF', color: '#0D3764' }}
        >
          {TIER_ORDER.map(t => (
            <option key={t} value={t}>{TIER_LABELS[t]}</option>
          ))}
        </select>
      ) : (
        <button
          onClick={onStartChange}
          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-1 transition-all"
          style={{ background: `${tierColor}18`, color: tierColor }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
        >
          {TIER_LABELS[project.tier] || 'Monitor'}
          <ChevronDown size={10} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

function NewProjectModal({ onClose, onSaved }) {
  const [name, setName]   = useState('')
  const [tier, setTier]   = useState('monitor')
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  async function handleSave() {
    if (!name.trim()) { showToast('please enter a project name'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('projects').insert({ name: name.trim(), tier })
      if (error) throw error
      showToast('project created')
      onSaved()
    } catch (err) {
      showToast(err.message)
    } finally {
      setSaving(false)
    }
  }

  const tierColor = TIER_COLORS[tier]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 transition-opacity duration-250"
        style={{ background: 'rgba(13,55,100,0.18)', opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />
      <div
        className="relative bg-sur border-2 w-full max-w-sm mx-4 transition-all duration-250"
        style={{
          borderColor: '#0D3764',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        <div className="flex justify-between items-center px-6 py-5"
          style={{ borderBottom: '1px solid rgba(13,55,100,0.10)', background: 'rgba(13,55,100,0.03)' }}>
          <h2 className="font-serif text-[18px] font-normal text-nb">new project</h2>
          <button onClick={handleClose} className="p-1.5 transition-colors"
            style={{ color: 'rgba(13,55,100,0.60)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#0D3764'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,55,100,0.60)'}>
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col gap-4">
          <ModalFormGroup label="project name">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Client Phoenix"
              autoFocus
              className={inputCls} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#E3492B'}
              onBlur={e => e.target.style.borderColor = '#0D3764'}
            />
          </ModalFormGroup>

          <ModalFormGroup label="tier">
            <select value={tier} onChange={e => setTier(e.target.value)} className={inputCls} style={inputStyle}>
              {TIER_ORDER.map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
            </select>
          </ModalFormGroup>

          <div className="text-[12px] font-mono px-3 py-2.5 leading-relaxed"
            style={{
              background: `${tierColor}12`,
              color: tierColor,
              borderLeft: `3px solid ${tierColor}`,
            }}>
            {TIER_DESCRIPTIONS[tier]}
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-2"
          style={{ borderTop: '1px solid rgba(13,55,100,0.10)', background: 'rgba(13,55,100,0.02)' }}>
          <button onClick={handleClose}
            className="text-sm font-medium font-mono px-5 py-2.5 border-2 cursor-pointer transition-all lowercase"
            style={{ background: 'transparent', color: 'rgba(13,55,100,0.55)', borderColor: '#0D3764' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0D3764'; e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(13,55,100,0.55)'; e.currentTarget.style.boxShadow = 'none' }}>
            cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="text-sm font-medium font-mono px-5 py-2.5 border-2 cursor-pointer bg-no text-white transition-all disabled:opacity-60 lowercase"
            style={{ borderColor: '#0D3764' }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764' }}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            {saving ? 'creating…' : 'create project'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ModalFormGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium tracking-[0.09em] font-mono lowercase"
        style={{ color: 'rgba(13,55,100,0.60)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'border-2 px-3 py-2 text-nb font-mono text-sm outline-none transition-colors w-full'
const inputStyle = { borderColor: '#0D3764', background: '#FFFFFF' }
