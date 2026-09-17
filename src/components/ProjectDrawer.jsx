import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { TIER_ORDER, TIER_LABELS, TIER_DESCRIPTIONS, TIER_COLORS, TIER_TEXT_COLORS, SQUAD_COLORS } from '../lib/utils'
import { showToast } from './Toast'
import { DEMO_ENABLED } from '../lib/demoMode'

// `onCreated` fires with the newly inserted row (create only). `zIndex` lets
// this stack above another drawer — the placement drawer opens it on top.
export function ProjectDrawer({ project, assignedMembers = [], session, onClose, onSaved, onCreated, zIndex = 100, defaultTier = 'monitor' }) {
  const isNew = !project

  const [name, setName]   = useState(project?.name || '')
  const [tier, setTier]   = useState(project?.tier || defaultTier)
  const [internal, setInternal] = useState(project?.internal || false)
  const [saving, setSaving]   = useState(false)
  const [visible, setVisible] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    if (isNew) return
    supabase
      .from('project_tier_history')
      .select('*')
      .eq('project_id', project.id)
      .order('changed_at', { ascending: false })
      .then(({ data }) => setHistory(data || []))
  }, [project?.id])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  async function handleDelete() {
    if (!window.confirm(`remove "${project.name}" and all its assignments?`)) return
    // LOCAL PREVIEW ONLY — remove with DemoRoster.jsx
    if (DEMO_ENABLED && window.__DEMO_MODE__) {
      showToast('demo mode — nothing was removed')
      return
    }
    setSaving(true)
    try {
      await supabase.from('assignments').delete().eq('project_id', project.id)
      const { error } = await supabase.from('projects').delete().eq('id', project.id)
      if (error) throw error
      showToast('project removed')
      onSaved()
      handleClose()
    } catch (err) {
      showToast(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) { showToast('please enter a project name'); return }
    // LOCAL PREVIEW ONLY — remove with DemoRoster.jsx. Keeps the demo page from
    // inserting a real row into the production projects table.
    if (DEMO_ENABLED && window.__DEMO_MODE__) {
      showToast('demo mode — project not created')
      onCreated?.({ id: `demo-${Date.now()}`, name: name.trim(), tier, internal })
      handleClose()
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        // Select the inserted row back so callers (e.g. the placement drawer)
        // can immediately reference the project they just created.
        const { data, error } = await supabase
          .from('projects')
          .insert({ name: name.trim(), tier, internal })
          .select()
          .single()
        if (error) throw error
        showToast('project created')
        onCreated?.(data)
      } else {
        const { error } = await supabase
          .from('projects')
          .update({ name: name.trim(), tier, internal })
          .eq('id', project.id)
        if (error) throw error

        if (tier !== project.tier) {
          await supabase.from('project_tier_history').insert({
            project_id: project.id,
            from_tier:  project.tier,
            to_tier:    tier,
            changed_by: session?.user?.email || '',
          })
        }
        showToast('project updated')
      }
      onSaved()
      handleClose()
    } catch (err) {
      showToast(err.message)
    } finally {
      setSaving(false)
    }
  }

  const tierColor     = TIER_COLORS[tier]
  const tierTextColor = TIER_TEXT_COLORS[tier]

  return (
    <div className="fixed inset-0 flex justify-end" style={{ zIndex }}>
      <div
        className="absolute inset-0 transition-opacity duration-250"
        style={{ background: 'rgba(13,55,100,0.18)', opacity: visible ? 1 : 0 }}
        onClick={handleClose}
      />

      <div
        className="relative flex flex-col bg-sur h-full w-full md:w-[460px] transition-transform duration-250"
        style={{
          borderLeft: '2px solid #0D3764',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(13,55,100,0.10)', background: 'rgba(13,55,100,0.03)' }}>
          <div>
            <h2 className="font-serif text-[20px] font-normal text-nb leading-none">
              {isNew ? 'new project' : 'edit project'}
            </h2>
            {!isNew && (
              <p className="text-[11px] font-mono mt-1" style={{ color: 'rgba(13,55,100,0.60)' }}>
                {project.name}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="p-1.5 transition-colors"
            style={{ color: 'rgba(13,55,100,0.60)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#0D3764'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,55,100,0.60)'}>
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          <SectionLabel>project details</SectionLabel>

          <FormGroup label="project name">
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
          </FormGroup>

          <FormGroup label="tier">
            <select value={tier} onChange={e => setTier(e.target.value)} className={inputCls} style={inputStyle}>
              {TIER_ORDER.map(t => <option key={t} value={t}>{TIER_LABELS[t]}</option>)}
            </select>
          </FormGroup>

          <div className="text-[12px] font-mono px-3 py-2.5 leading-relaxed"
            style={{
              background: `${tierColor}30`,
              color: tierTextColor,
              borderLeft: `3px solid ${tierColor}`,
            }}>
            {TIER_DESCRIPTIONS[tier]}
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <span
              className="flex-shrink-0 w-4 h-4 border-2 flex items-center justify-center mt-0.5"
              style={{ borderColor: '#0D3764', background: internal ? '#0D3764' : 'transparent' }}
            >
              {internal && <span className="w-1.5 h-1.5 bg-white" />}
            </span>
            <input type="checkbox" checked={internal} onChange={e => setInternal(e.target.checked)} className="hidden" />
            <span className="text-[12px] font-mono leading-relaxed" style={{ color: 'rgba(13,55,100,0.70)' }}>
              internal project — hidden from accounts, not counted in tiers
            </span>
          </label>

          {!isNew && assignedMembers.length > 0 && (
            <div>
              <SectionLabel>team</SectionLabel>
              <div className="mt-3 flex flex-col gap-1.5">
                {assignedMembers.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <span className="w-2 h-2 inline-block flex-shrink-0 rounded-full" style={{ background: SQUAD_COLORS[m.squad] }} />
                    <span className="text-[13px] font-mono" style={{ color: '#0D3764' }}>{m.name}</span>
                    <span className="text-[11px] font-mono ml-auto" style={{ color: 'rgba(13,55,100,0.40)' }}>
                      {m.squad.toLowerCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isNew && (
            <div>
              <SectionLabel>tier history</SectionLabel>
              {history.length === 0 ? (
                <p className="text-[12px] font-mono mt-3" style={{ color: 'rgba(13,55,100,0.35)' }}>
                  no changes recorded yet
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-2">
                  {history.map(h => (
                    <div key={h.id} className="flex items-start justify-between gap-4 py-2.5 px-3 border-l-2"
                      style={{ borderColor: 'rgba(13,55,100,0.12)', background: 'rgba(13,55,100,0.02)' }}>
                      <div>
                        <div className="flex items-center gap-1.5 text-[12px] font-mono">
                          <span style={{ color: TIER_TEXT_COLORS[h.from_tier] || 'rgba(13,55,100,0.50)' }}>
                            {TIER_LABELS[h.from_tier] || h.from_tier}
                          </span>
                          <span style={{ color: 'rgba(13,55,100,0.35)' }}>→</span>
                          <span className="font-medium" style={{ color: TIER_TEXT_COLORS[h.to_tier] || '#0D3764' }}>
                            {TIER_LABELS[h.to_tier] || h.to_tier}
                          </span>
                        </div>
                        {h.changed_by && (
                          <div className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(13,55,100,0.40)' }}>
                            {h.changed_by}
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] font-mono flex-shrink-0" style={{ color: 'rgba(13,55,100,0.40)' }}>
                        {new Date(h.changed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(13,55,100,0.10)', background: 'rgba(13,55,100,0.02)' }}>
          {!isNew && (
            <button onClick={handleDelete} disabled={saving}
              className="text-sm font-medium font-mono px-4 py-2.5 border-2 cursor-pointer transition-all lowercase"
              style={{ background: 'transparent', color: '#E3492B', borderColor: '#E3492B' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(227,73,43,0.06)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}>
              remove
            </button>
          )}
          <div className="flex gap-2 ml-auto">
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
            {saving ? 'saving…' : isNew ? 'create project' : 'save changes'}
          </button>
          </div>
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

function FormGroup({ label, children }) {
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
