import { useState, useEffect } from 'react'
import { X, Copy, Check, TriangleAlert, ExternalLink, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import {
  PLACEMENT_STAGES, PLACEMENT_STAGE_LABELS, PLACEMENT_STAGE_DESCRIPTIONS,
  placementShareUrl, totalAlloc, copyToClipboard, googleDocPreviewUrl, formatDate,
  placementDesigners, ENGAGEMENT_OPTIONS,
} from '../lib/utils'
import { DEMO_ENABLED } from '../lib/demoMode'
import { showToast } from './Toast'
import { ProjectDrawer } from './ProjectDrawer'

// A placement is anchored to a PROJECT. The designer is unknown when it starts
// and gets attached at stage 2 — that's what stage 2 exists to decide.
export function PlacementDrawer({ placement, projects = [], allMembers = [], onClose, onRefresh, onSaved }) {
  // Once a fresh placement is created we keep the drawer open (switched into
  // "edit" mode) instead of closing it, so the share link is visible right away.
  const [createdPlacement, setCreatedPlacement] = useState(null)
  const activePlacement = placement || createdPlacement
  const isNew = !activePlacement

  const [localProjects, setLocalProjects] = useState(projects)
  const [projectId, setProjectId]   = useState(placement?.project_id || null)
  const [projectName, setProjectName] = useState(placement?.project_name || '')
  const [creatingProject, setCreatingProject] = useState(false)

  const [designers, setDesigners]   = useState(() => placementDesigners(placement))
  const [stage, setStage]           = useState(placement?.stage || 'brief')
  const [poc, setPoc]               = useState(placement?.point_of_contact || '')
  const [arbisoftContact, setArbisoftContact] = useState(placement?.arbisoft_contact || '')
  const [timelineNotes, setTimelineNotes]     = useState(placement?.timeline_notes || '')
  const [onboardingDate, setOnboardingDate]   = useState(placement?.onboarding_date || '')

  // The brief lives on the project, so it's seeded from the selected project
  // rather than from the placement.
  const selectedProject = localProjects.find(p => p.id === projectId) || null
  const [briefUrl, setBriefUrl] = useState(selectedProject?.brief_url || '')
  const [briefDirty, setBriefDirty] = useState(false)

  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [visible, setVisible] = useState(false)
  const [copied, setCopied]   = useState(false)

  const xdmOptions = allMembers.filter(m => m.seniority === 'XDM')
  // Squads involved are derived from whoever is assigned — a placement can span
  // more than one, so there's no single squad field any more.
  const squadsInvolved = [...new Set(designers.map(d => d.squad).filter(Boolean))]

  // Anyone whose existing commitments plus this placement push them over 100%.
  const overCommitted = designers
    .map(d => {
      const m = allMembers.find(x => x.id === d.member_id)
      if (!m) return null
      const existing = totalAlloc(m.assignments)
      return existing + (d.pct || 0) > 100
        ? { name: m.name, total: existing + (d.pct || 0) }
        : null
    })
    .filter(Boolean)

  // Compare as YYYY-MM-DD strings — lexicographic order matches chronological
  // order for ISO dates, and it sidesteps timezone drift from Date parsing.
  const todayIso = new Date().toLocaleDateString('en-CA')
  const onboardingPassed = Boolean(onboardingDate) && onboardingDate < todayIso
  const isFinalStage = stage === 'onboarding_set'

  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key !== 'Escape') return
      // The preview modal and project drawer sit on top and register their own
      // Escape handlers on `document`. Sibling listeners on the same node can't
      // be stopped by stopPropagation, so defer here and let the topmost
      // overlay close first — otherwise one keypress dismisses both.
      if (showPreview || creatingProject) return
      close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showPreview, creatingProject])

  function close() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  function handleProjectSelect(id) {
    if (id === '__new__') { setCreatingProject(true); return }
    const proj = localProjects.find(p => p.id === id)
    setProjectId(id || null)
    setProjectName(proj?.name || '')
    // Brief belongs to the project, so switching project swaps the brief too.
    if (!briefDirty) setBriefUrl(proj?.brief_url || '')
  }

  function handleProjectCreated(proj) {
    setLocalProjects(prev => [...prev, proj].sort((a, b) => a.name.localeCompare(b.name)))
    setProjectId(proj.id)
    setProjectName(proj.name)
    if (!briefDirty) setBriefUrl(proj.brief_url || '')
    setCreatingProject(false)
  }

  function handleDesignersChange(next) {
    setDesigners(next)
    // Default the point of contact to the first assigned designer's squad XDM,
    // but never override an explicit choice.
    if (!poc) {
      const firstWithSquad = next.find(d => d.squad)
      if (firstWithSquad) {
        const xdm = allMembers.find(x => x.squad === firstWithSquad.squad && x.seniority === 'XDM')
        if (xdm) setPoc(xdm.name)
      }
    }
  }

  // Replace the whole designer set for a placement. Same delete-then-insert
  // approach MemberModal uses for assignments — simpler than diffing, and the
  // rows carry no history worth preserving.
  async function saveDesigners(placementId) {
    const { error: delErr } = await supabase
      .from('placement_designers').delete().eq('placement_id', placementId)
    if (delErr) throw delErr

    const rows = designers
      .filter(d => d.member_id)
      .map(d => ({
        placement_id: placementId,
        member_id:    d.member_id,
        member_name:  d.member_name || '',
        squad:        d.squad || '',
        pct:          d.pct ?? 100,
        engagement:   d.engagement || 'Full Time (100%)',
      }))
    if (rows.length === 0) return

    const { error: insErr } = await supabase.from('placement_designers').insert(rows)
    if (insErr) throw insErr
  }

  async function handleSave() {
    if (!projectId) { showToast('please select or create a project'); return }

    // LOCAL PREVIEW ONLY — remove with DemoRoster.jsx
    if (DEMO_ENABLED && window.__DEMO_MODE__) {
      showToast('demo mode — nothing was saved')
      return
    }

    setSaving(true)
    try {
      const payload = {
        project_id:        projectId,
        project_name:      projectName,
        // The full team lives in placement_designers. These are kept in sync
        // with the first designer so anything still reading them stays correct.
        member_id:         designers[0]?.member_id || null,
        member_name:       designers[0]?.member_name || '',
        stage,
        squad:             designers[0]?.squad || '',
        point_of_contact:  poc,
        arbisoft_contact:  arbisoftContact,
        timeline_notes:    timelineNotes,
        onboarding_date:   onboardingDate || null,
        updated_at:        new Date().toISOString(),
      }

      // The brief is stored on the project, so it's a separate write.
      if (briefDirty && briefUrl.trim() !== (selectedProject?.brief_url || '')) {
        const { error: bErr } = await supabase
          .from('projects')
          .update({ brief_url: briefUrl.trim() })
          .eq('id', projectId)
        if (bErr) throw bErr
      }

      if (!activePlacement) {
        const { data, error } = await supabase
          .from('placements').insert(payload).select().single()
        if (error) throw error
        await saveDesigners(data.id)
        showToast('placement started — link ready below')
        setCreatedPlacement(data)
        onRefresh()
      } else {
        const { error } = await supabase
          .from('placements').update(payload).eq('id', activePlacement.id)
        if (error) throw error
        await saveDesigners(activePlacement.id)
        showToast(isFinalStage ? 'placement finished' : 'placement updated')
        onSaved()
        close()
      }
    } catch (err) {
      showToast(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('remove this placement?')) return
    // LOCAL PREVIEW ONLY — remove with DemoRoster.jsx
    if (DEMO_ENABLED && window.__DEMO_MODE__) {
      showToast('demo mode — nothing was removed')
      return
    }
    setSaving(true)
    await supabase.from('placements').delete().eq('id', activePlacement.id)
    showToast('placement removed')
    onSaved()
    close()
    setSaving(false)
  }

  async function copyLink() {
    const ok = await copyToClipboard(placementShareUrl(activePlacement.share_token))
    if (!ok) { showToast('could not copy to clipboard'); return }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className="absolute inset-0 transition-opacity duration-250"
        style={{ background: 'rgba(13,55,100,0.18)', opacity: visible ? 1 : 0 }}
        onClick={close}
      />

      <div
        className="relative flex flex-col bg-sur h-full w-full md:w-[460px] transition-transform duration-250"
        style={{ borderLeft: '2px solid #0D3764', transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(13,55,100,0.10)', background: 'rgba(13,55,100,0.03)' }}>
          <div>
            <h2 className="font-serif text-[20px] font-normal text-nb leading-none">
              {isNew ? 'start placement' : 'edit placement'}
            </h2>
            <p className="text-[11px] font-mono mt-1 lowercase" style={{ color: 'rgba(13,55,100,0.60)' }}>
              {projectName || 'no project selected'}
              {designers.length === 0
                ? ' · designers tbd'
                : designers.length === 1
                  ? ` · ${designers[0].member_name || 'designer tbd'}`
                  : ` · ${designers.length} designers`}
            </p>
          </div>
          <button onClick={close} className="p-1.5 transition-colors"
            style={{ color: 'rgba(13,55,100,0.60)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#0D3764'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,55,100,0.60)'}>
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {isFinalStage && onboardingPassed && (
            <div className="flex items-start gap-2.5 p-3 border-2 text-[12px] font-mono leading-relaxed"
              style={{ borderColor: '#E3492B', background: 'rgba(227,73,43,0.06)', color: '#0D3764' }}>
              <TriangleAlert size={15} strokeWidth={2} style={{ color: '#E3492B', flexShrink: 0, marginTop: 1 }} />
              <span>
                the onboarding date ({formatDate(onboardingDate)}) has passed — do you want to finish this placement?
              </span>
            </div>
          )}

          {overCommitted.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 border-2 text-[12px] font-mono leading-relaxed"
              style={{ borderColor: '#E3492B', background: 'rgba(227,73,43,0.06)', color: '#0D3764' }}>
              <TriangleAlert size={15} strokeWidth={2} style={{ color: '#E3492B', flexShrink: 0, marginTop: 1 }} />
              <span>
                {overCommitted.map(o => `${o.name} would be at ${o.total}%`).join(', ')}
                {' '}— over capacity. you can still assign them.
              </span>
            </div>
          )}

          <FormGroup label="project">
            <select
              value={projectId || ''}
              onChange={e => handleProjectSelect(e.target.value)}
              className={inputCls} style={inputStyle}
            >
              <option value="">select project…</option>
              {localProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="__new__">+ new project</option>
            </select>
          </FormGroup>

          <SectionLabel>pipeline stage</SectionLabel>
          <div className="flex flex-col gap-2">
            {PLACEMENT_STAGES.map((s, i) => (
              <div key={s} className="flex flex-col gap-2">
                <button type="button" onClick={() => setStage(s)}
                  className="flex items-start gap-3 text-left p-3 border-2 transition-all"
                  style={stage === s
                    ? { borderColor: '#E3492B', background: 'rgba(227,73,43,0.05)' }
                    : { borderColor: '#0D3764', background: 'transparent' }}>
                  <span className="flex-shrink-0 w-5 h-5 border-2 flex items-center justify-center text-[11px] font-mono mt-0.5"
                    style={{
                      borderColor: stage === s ? '#E3492B' : '#0D3764',
                      color: stage === s ? '#E3492B' : 'rgba(13,55,100,0.55)',
                    }}>
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[13px] font-mono lowercase" style={{ color: '#0D3764' }}>
                      {PLACEMENT_STAGE_LABELS[s]}
                    </span>
                    <span className="block text-[11px] font-mono mt-0.5 leading-relaxed" style={{ color: 'rgba(13,55,100,0.55)' }}>
                      {PLACEMENT_STAGE_DESCRIPTIONS[s]}
                    </span>
                  </span>
                </button>

                {s === 'brief' && stage === 'brief' && (
                  <BriefLinkWidget
                    url={briefUrl}
                    projectName={projectName}
                    onChange={v => { setBriefUrl(v); setBriefDirty(true) }}
                    onShowPreview={() => setShowPreview(true)}
                  />
                )}

                {s === 'squad_poc' && stage === 'squad_poc' && (
                  <DesignerWidget
                    designers={designers}
                    onDesignersChange={handleDesignersChange}
                    members={allMembers}
                    poc={poc}
                    onPocChange={setPoc}
                    arbisoftContact={arbisoftContact}
                    onArbisoftChange={setArbisoftContact}
                    xdmOptions={xdmOptions}
                  />
                )}

                {s === 'intro_call' && stage === 'intro_call' && (
                  <TimelineWidget notes={timelineNotes} onChange={setTimelineNotes} />
                )}

                {s === 'onboarding_set' && stage === 'onboarding_set' && (
                  <OnboardingWidget date={onboardingDate} onChange={setOnboardingDate} />
                )}
              </div>
            ))}
          </div>

          <SectionLabel>details</SectionLabel>

          {/* Values captured at earlier stages surface here as read-only
              summaries once you've moved off the stage that owns them. */}
          {stage !== 'brief' && briefUrl && (
            <DetailRow label="design brief">
              <a href={briefUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 lowercase transition-colors"
                style={{ color: '#1B998B' }}
                onMouseEnter={e => e.currentTarget.style.color = '#0D3764'}
                onMouseLeave={e => e.currentTarget.style.color = '#1B998B'}>
                <ExternalLink size={12} strokeWidth={2} />
                open design brief
              </a>
            </DetailRow>
          )}

          {stage !== 'squad_poc' && designers.length > 0 && (
            <DetailRow label={designers.length === 1 ? 'designer' : `designers (${designers.length})`}>
              <div className="flex flex-col gap-1">
                {designers.map((d, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span>{d.member_name || 'unassigned'}</span>
                    <span className="text-[11px]" style={{ color: 'rgba(13,55,100,0.60)' }}>
                      {d.squad?.toLowerCase()}
                    </span>
                    <span className="text-[11px] ml-auto" style={{ color: '#1B998B' }}>{d.pct}%</span>
                  </div>
                ))}
                {squadsInvolved.length > 1 && (
                  <span className="text-[11px] mt-0.5" style={{ color: 'rgba(13,55,100,0.60)' }}>
                    spans {squadsInvolved.length} squads
                  </span>
                )}
              </div>
            </DetailRow>
          )}

          {stage !== 'squad_poc' && poc && (
            <DetailRow label="xdm point of contact">{poc}</DetailRow>
          )}

          {stage !== 'squad_poc' && arbisoftContact && (
            <DetailRow label="arbisoft contact">{arbisoftContact}</DetailRow>
          )}

          {stage !== 'intro_call' && timelineNotes && (
            <DetailRow label="timeline / notes">
              <span className="whitespace-pre-wrap leading-relaxed">{timelineNotes}</span>
            </DetailRow>
          )}

          {/* Stage 4 is terminal — there's no later stage to move to, so the
              date summarises here as soon as it's set rather than on exit. */}
          {onboardingDate && (
            <DetailRow label="onboarding date">
              <span style={{ color: onboardingPassed ? '#E3492B' : '#1B998B' }}>
                {formatDate(onboardingDate)}{onboardingPassed ? ' · passed' : ''}
              </span>
            </DetailRow>
          )}

          {!briefUrl && !designers.length && !poc && !arbisoftContact && !timelineNotes && !onboardingDate && (
            <p className="text-[12px] font-mono" style={{ color: 'rgba(13,55,100,0.50)' }}>
              nothing captured yet — fill each stage as you go.
            </p>
          )}

          {!isNew && (
            <>
              <SectionLabel>share link</SectionLabel>
              <p className="text-[12px] font-mono leading-relaxed" style={{ color: 'rgba(13,55,100,0.55)' }}>
                read-only view for the client — shows only this placement, no login needed.
              </p>
              <button onClick={copyLink} type="button"
                className="flex items-center justify-center gap-1.5 text-[13px] font-mono w-full py-2.5 px-3 border-2 cursor-pointer transition-all lowercase"
                style={{ color: '#0D3764', background: 'transparent', borderColor: '#0D3764' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                {copied ? <Check size={13} strokeWidth={2} /> : <Copy size={13} strokeWidth={2} />}
                {copied ? 'copied' : 'copy share link'}
              </button>
            </>
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
            <button onClick={close}
              className="text-sm font-medium font-mono px-5 py-2.5 border-2 cursor-pointer transition-all lowercase"
              style={{ background: 'transparent', color: 'rgba(13,55,100,0.55)', borderColor: '#0D3764' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0D3764'; e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(13,55,100,0.55)'; e.currentTarget.style.boxShadow = 'none' }}>
              {isNew ? 'cancel' : 'close'}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="text-sm font-medium font-mono px-5 py-2.5 border-2 cursor-pointer text-white transition-all disabled:opacity-60 lowercase"
              style={{
                borderColor: '#0D3764',
                // Green on the final stage so finishing reads as completion
                // rather than another incremental save.
                background: !isNew && isFinalStage ? '#1B998B' : '#0D3764',
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764' }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              {saving ? 'saving…' : isNew ? 'start placement' : isFinalStage ? 'finish placement' : 'save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>

    {showPreview && googleDocPreviewUrl(briefUrl) && (
      <BriefPreviewModal url={briefUrl} onClose={() => setShowPreview(false)} />
    )}

    {/* Rendered outside the sliding panel above: a position:fixed element
        inside a transformed ancestor positions against that ancestor rather
        than the viewport, which would break this drawer's layout. */}
    {creatingProject && (
      <ProjectDrawer
        project={null}
        session={null}
        zIndex={110}
        defaultTier="coach"
        onCreated={handleProjectCreated}
        onSaved={() => {}}
        onClose={() => setCreatingProject(false)}
      />
    )}
    </>
  )
}

// Shared shell for the per-stage field cards, matching the assignment cards
// in MemberModal — eggshell fill, navy border, muted lowercase header.
function StageCard({ title, onClear, children }) {
  return (
    <div className="p-4 border-2" style={{ background: '#F5F0E3', borderColor: '#0D3764' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium font-mono tracking-wider lowercase"
          style={{ color: 'rgba(13,55,100,0.60)' }}>
          {title}
        </span>
        {onClear && (
          <button type="button" onClick={onClear}
            title="clear"
            className="text-lg font-mono leading-none transition-colors"
            style={{ color: 'rgba(13,55,100,0.50)' }}
            onMouseEnter={e => e.target.style.color = '#E3492B'}
            onMouseLeave={e => e.target.style.color = 'rgba(13,55,100,0.50)'}>×</button>
        )}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

// Read-only summary row shown under "details" once a stage's fields are filled
// and you've moved off that stage.
function DetailRow({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium tracking-[0.09em] font-mono lowercase"
        style={{ color: 'rgba(13,55,100,0.60)' }}>{label}</span>
      <div className="text-[13px] font-mono" style={{ color: '#0D3764' }}>{children}</div>
    </div>
  )
}

function BriefLinkWidget({ url, projectName, onChange, onShowPreview }) {
  const previewUrl = googleDocPreviewUrl(url)
  const looksInvalid = url.trim() && !previewUrl

  return (
    <StageCard title="design brief" onClear={url ? () => onChange('') : undefined}>
      <>
        <p className="text-[11px] font-mono leading-relaxed" style={{ color: 'rgba(13,55,100,0.60)' }}>
          saved on {projectName ? `“${projectName}”` : 'the project'}, so it carries across
          every placement for it.
        </p>

        <FormGroup label="google doc link">
          <input
            type="url"
            value={url}
            onChange={e => onChange(e.target.value)}
            placeholder="paste the google doc link"
            className={inputCls} style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#E3492B'}
            onBlur={e => e.target.style.borderColor = '#0D3764'}
          />
        </FormGroup>

        {looksInvalid && (
          <span className="text-[11px] font-mono leading-relaxed" style={{ color: '#E3492B' }}>
            that doesn't look like a google doc link — it should contain /d/&lt;id&gt;
          </span>
        )}

        {previewUrl && (
          <div className="flex gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-mono px-2.5 py-1.5 border-2 lowercase transition-all"
              style={{ borderColor: '#0D3764', color: '#0D3764' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <ExternalLink size={12} strokeWidth={2} />
              open doc
            </a>
            <button type="button" onClick={onShowPreview}
              className="inline-flex items-center gap-1.5 text-[12px] font-mono px-2.5 py-1.5 border-2 cursor-pointer lowercase transition-all"
              style={{ borderColor: '#0D3764', color: 'rgba(13,55,100,0.60)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              show preview
            </button>
          </div>
        )}
      </>
    </StageCard>
  )
}

// Stage 2 is where the designers are chosen. A project often takes a
// combination of people, drawn from different squads, each at a different
// capacity — so this is a repeatable list rather than a single picker.
function DesignerWidget({
  designers, onDesignersChange, members,
  poc, onPocChange, arbisoftContact, onArbisoftChange, xdmOptions,
}) {
  const sorted = [...members].sort((a, b) => a.name.localeCompare(b.name))
  const takenIds = designers.map(d => d.member_id).filter(Boolean)
  const totalPct = designers.reduce((sum, d) => sum + (d.pct || 0), 0)

  function addDesigner() {
    onDesignersChange([
      ...designers,
      { member_id: '', member_name: '', squad: '', pct: 100, engagement: 'Full Time (100%)' },
    ])
  }

  function removeDesigner(i) {
    onDesignersChange(designers.filter((_, idx) => idx !== i))
  }

  function updateDesigner(i, patch) {
    onDesignersChange(designers.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))
  }

  function pickMember(i, memberId) {
    const m = members.find(x => x.id === memberId)
    updateDesigner(i, {
      member_id:   memberId,
      member_name: m?.name || '',
      squad:       m?.squad || '',
    })
  }

  return (
    <StageCard title="designers, squads & point of contact">
      <>
        {designers.length === 0 && (
          <p className="text-[11px] font-mono leading-relaxed" style={{ color: 'rgba(13,55,100,0.60)' }}>
            no designers assigned yet — a project can take several, from different squads.
          </p>
        )}

        {designers.map((d, i) => {
          const member = members.find(x => x.id === d.member_id)
          // Capacity already committed elsewhere, ignoring this placement.
          const existingAlloc = totalAlloc(member?.assignments)
          const wouldExceed = member && existingAlloc + (d.pct || 0) > 100

          return (
            <div key={i} className="p-3 border-2 flex flex-col gap-3"
              style={{ background: '#FFFFFF', borderColor: '#0D3764' }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium font-mono tracking-wider lowercase"
                  style={{ color: 'rgba(13,55,100,0.60)' }}>
                  designer {i + 1}
                </span>
                <button type="button" onClick={() => removeDesigner(i)}
                  title="remove designer"
                  className="text-lg font-mono leading-none transition-colors"
                  style={{ color: 'rgba(13,55,100,0.50)' }}
                  onMouseEnter={e => e.target.style.color = '#E3492B'}
                  onMouseLeave={e => e.target.style.color = 'rgba(13,55,100,0.50)'}>×</button>
              </div>

              <FormGroup label="designer">
                <select value={d.member_id} onChange={e => pickMember(i, e.target.value)}
                  className={inputCls} style={inputStyle}>
                  <option value="">select designer…</option>
                  {sorted
                    // Hide anyone already on this placement, except this row's own pick.
                    .filter(m => m.id === d.member_id || !takenIds.includes(m.id))
                    .map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} · {m.squad.toLowerCase()} · {m.seniority.toLowerCase()}
                      </option>
                    ))}
                </select>
              </FormGroup>

              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="squad">
                  <div className={inputCls}
                    style={{ ...inputStyle, background: '#F4F4F4', color: 'rgba(13,55,100,0.60)' }}>
                    {d.squad || '—'}
                  </div>
                </FormGroup>

                <FormGroup label="capacity">
                  <select
                    value={d.engagement}
                    onChange={e => {
                      const opt = ENGAGEMENT_OPTIONS.find(o => o.label === e.target.value)
                      updateDesigner(i, { engagement: e.target.value, pct: opt?.pct ?? 100 })
                    }}
                    className={inputCls} style={inputStyle}>
                    {ENGAGEMENT_OPTIONS.map(o => <option key={o.label}>{o.label}</option>)}
                  </select>
                </FormGroup>
              </div>

              {wouldExceed && (
                <span className="text-[11px] font-mono leading-relaxed" style={{ color: '#E3492B' }}>
                  {member.name} is already {existingAlloc}% allocated — adding {d.pct}% here
                  puts them at {existingAlloc + d.pct}%.
                </span>
              )}
            </div>
          )
        })}

        <button type="button" onClick={addDesigner}
          className="flex items-center justify-center gap-1.5 text-[13px] font-mono w-full py-2.5 px-3 border-2 cursor-pointer transition-all lowercase"
          style={{ color: '#E3492B', background: 'transparent', borderColor: '#E3492B' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(227,73,43,0.06)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}>
          <Plus size={13} strokeWidth={2} />
          add designer
        </button>

        {designers.length > 1 && (
          <p className="text-[11px] font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
            {designers.length} designers · {totalPct}% combined capacity on this project
          </p>
        )}

        <FormGroup label="xdm point of contact">
          <select value={poc} onChange={e => onPocChange(e.target.value)} className={inputCls} style={inputStyle}>
            <option value="">select xdm…</option>
            {xdmOptions.map(m => (
              <option key={m.id} value={m.name}>
                {m.name} · {m.squad.toLowerCase()}
              </option>
            ))}
          </select>
        </FormGroup>

        <FormGroup label="arbisoft contact">
          <input type="text" value={arbisoftContact} onChange={e => onArbisoftChange(e.target.value)}
            placeholder="who we spoke to for timeline/info" className={inputCls} style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#E3492B'}
            onBlur={e => e.target.style.borderColor = '#0D3764'} />
        </FormGroup>
      </>
    </StageCard>
  )
}

function TimelineWidget({ notes, onChange }) {
  return (
    <StageCard title="initial call" onClear={notes ? () => onChange('') : undefined}>
      <FormGroup label="timeline / notes">
        <textarea value={notes} onChange={e => onChange(e.target.value)}
          placeholder="what came out of the initial call..."
          rows={3} className={inputCls + ' resize-none'} style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#E3492B'}
          onBlur={e => e.target.style.borderColor = '#0D3764'} />
      </FormGroup>
    </StageCard>
  )
}

function OnboardingWidget({ date, onChange }) {
  return (
    <StageCard title="onboarding" onClear={date ? () => onChange('') : undefined}>
      <FormGroup label="onboarding date">
        <input type="date" value={date || ''} onChange={e => onChange(e.target.value)}
          className={inputCls} style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#E3492B'}
          onBlur={e => e.target.style.borderColor = '#0D3764'} />
      </FormGroup>
    </StageCard>
  )
}

// Full-screen preview. Rendered from the drawer's top level rather than inside
// the widget — a position:fixed element nested in a transformed ancestor
// positions against that ancestor instead of the viewport.
function BriefPreviewModal({ url, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6" style={{ zIndex: 120 }}>
      <div className="absolute inset-0" style={{ background: 'rgba(13,55,100,0.45)' }} onClick={onClose} />

      <div className="relative flex flex-col bg-sur border-2 w-full"
        style={{ borderColor: '#0D3764', maxWidth: 1000, height: '88vh' }}>
        <div className="flex justify-between items-center px-5 py-3 flex-shrink-0"
          style={{ borderBottom: '2px solid #0D3764', background: 'rgba(13,55,100,0.03)' }}>
          <div>
            <h3 className="font-serif text-[17px] font-normal text-nb leading-none">design brief</h3>
            <p className="text-[11px] font-mono mt-1 lowercase" style={{ color: 'rgba(13,55,100,0.60)' }}>
              read-only — google blocks editing inside an embed
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-mono px-2.5 py-1.5 border-2 lowercase transition-all"
              style={{ borderColor: '#0D3764', color: '#0D3764' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <ExternalLink size={12} strokeWidth={2} />
              edit in google docs
            </a>
            <button onClick={onClose} className="p-1.5 transition-colors"
              style={{ color: 'rgba(13,55,100,0.60)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#0D3764'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,55,100,0.60)'}>
              <X size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <iframe
          src={googleDocPreviewUrl(url)}
          title="design brief preview"
          className="flex-1 w-full"
          style={{ background: '#FFFFFF', border: 'none' }}
        />

        <div className="px-5 py-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(13,55,100,0.10)' }}>
          <span className="text-[11px] font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
            blank? the doc isn't shared with your account.
          </span>
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
