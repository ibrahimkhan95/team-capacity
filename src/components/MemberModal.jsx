import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ENGAGEMENT_OPTIONS, formatDate, parseDate } from '../lib/utils'
import { showToast } from './Toast'

export function MemberModal({ member, squad, onClose, onSaved }) {
  const isNew = !member

  const [name, setName]           = useState(member?.name || '')
  const [seniority, setSeniority] = useState(member?.seniority || 'Mid')
  const [status, setStatus]       = useState(member?.status || 'On Project')
  const [notes, setNotes]         = useState(member?.notes || '')
  const [assignments, setAssignments] = useState(
    (member?.assignments || []).map(a => ({ ...a }))
  )
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  function close() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function addAssignment() {
    setAssignments(prev => [...prev, { project: '', engagement: 'Full Time (100%)', pct: 100, start_date: '', start_date_input: '', notes: '' }])
  }

  function removeAssignment(i) {
    setAssignments(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateAssignment(i, field, value) {
    setAssignments(prev => prev.map((a, idx) => {
      if (idx !== i) return a
      const fields = typeof field === 'object' ? field : { [field]: value }
      const updated = { ...a, ...fields }
      if ('engagement' in fields) {
        updated.pct = ENGAGEMENT_OPTIONS.find(o => o.label === fields.engagement)?.pct || 100
      }
      return updated
    }))
  }

  async function handleSave() {
    if (!name.trim()) { showToast('please enter a name'); return }
    setSaving(true)
    try {
      if (isNew) {
        const { data: newMember, error: mErr } = await supabase
          .from('members')
          .insert({ name: name.trim(), seniority, squad, status, notes })
          .select()
          .single()
        if (mErr) throw mErr
        if (assignments.length > 0) {
          const rows = assignments.map(({ start_date_input: _sdi, ...a }) => ({ ...a, member_id: newMember.id }))
          const { error: aErr } = await supabase.from('assignments').insert(rows)
          if (aErr) throw aErr
        }
        showToast('member added')
      } else {
        const { error: mErr } = await supabase
          .from('members')
          .update({ name: name.trim(), seniority, status, notes })
          .eq('id', member.id)
        if (mErr) throw mErr
        await supabase.from('assignments').delete().eq('member_id', member.id)
        if (assignments.length > 0) {
          const rows = assignments.map(({ id: _id, member_id: _mid, start_date_input: _sdi, ...rest }) => ({
            ...rest,
            member_id: member.id,
          }))
          const { error: aErr } = await supabase.from('assignments').insert(rows)
          if (aErr) throw aErr
        }
        showToast('changes saved')
      }
      onSaved()
      close()
    } catch (err) {
      showToast(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('remove this member?')) return
    setSaving(true)
    await supabase.from('members').delete().eq('id', member.id)
    showToast('member removed')
    onSaved()
    close()
    setSaving(false)
  }

  const showAssignments = status === 'On Project'

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-250"
        style={{ background: 'rgba(13,55,100,0.18)', opacity: visible ? 1 : 0 }}
        onClick={close}
      />

      {/* Drawer */}
      <div
        className="relative flex flex-col bg-sur h-full w-[460px] transition-transform duration-250"
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
              {isNew ? 'add member' : 'edit member'}
            </h2>
            <p className="text-[11px] font-mono mt-1 lowercase" style={{ color: 'rgba(13,55,100,0.42)' }}>
              {squad}
            </p>
          </div>
          <button onClick={close} className="p-1.5 transition-colors"
            style={{ color: 'rgba(13,55,100,0.42)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#0D3764'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,55,100,0.42)'}>
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          <SectionLabel>person details</SectionLabel>

          <FormGroup label="full name">
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Asad Jan Khattak" className={inputCls} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#E3492B'}
              onBlur={e => e.target.style.borderColor = '#0D3764'} />
          </FormGroup>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="seniority">
              <select value={seniority} onChange={e => setSeniority(e.target.value)} className={inputCls} style={inputStyle}>
                {['Junior','Mid','Senior','XDM'].map(s => <option key={s}>{s}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="status">
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls} style={inputStyle}>
                {['On Project','Bench','On Leave','Exiting'].map(s => <option key={s}>{s}</option>)}
              </select>
            </FormGroup>
          </div>

          <FormGroup label="notes">
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="upcoming changes, flags, context..."
              rows={3} className={inputCls + ' resize-none'} style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#E3492B'}
              onBlur={e => e.target.style.borderColor = '#0D3764'} />
          </FormGroup>

          {/* Assignments */}
          <div>
            <div className={!showAssignments ? 'opacity-40' : undefined}>
              <SectionLabel>project assignments</SectionLabel>
            </div>

            {showAssignments && (
              <div className="flex flex-col gap-3 mt-4">
                {assignments.map((a, i) => (
                  <div key={i} className="p-4 border-2"
                    style={{ background: '#F5F0E3', borderColor: '#0D3764' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-medium font-mono tracking-wider lowercase"
                        style={{ color: 'rgba(13,55,100,0.42)' }}>
                        assignment {i + 1}
                      </span>
                      <button onClick={() => removeAssignment(i)}
                        className="text-lg font-mono leading-none transition-colors"
                        style={{ color: 'rgba(13,55,100,0.30)' }}
                        onMouseEnter={e => e.target.style.color = '#E3492B'}
                        onMouseLeave={e => e.target.style.color = 'rgba(13,55,100,0.30)'}>×</button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <FormGroup label="project / initiative name">
                        <input type="text" value={a.project}
                          onChange={e => updateAssignment(i, 'project', e.target.value)}
                          placeholder="e.g. Client Phoenix" className={inputCls} style={inputStyle}
                          onFocus={e => e.target.style.borderColor = '#E3492B'}
                          onBlur={e => e.target.style.borderColor = '#0D3764'} />
                      </FormGroup>

                      <div className="grid grid-cols-2 gap-3">
                        <FormGroup label="engagement">
                          <select value={a.engagement} onChange={e => updateAssignment(i, 'engagement', e.target.value)}
                            className={inputCls} style={inputStyle}>
                            {ENGAGEMENT_OPTIONS.map(o => <option key={o.label}>{o.label}</option>)}
                          </select>
                        </FormGroup>
                        <FormGroup label="start date">
                          <input type="text"
                            value={a.start_date_input !== undefined ? a.start_date_input : (a.start_date ? formatDate(a.start_date) : '')}
                            onChange={e => {
                              let val = e.target.value.replace(/[^\d]/g, '')
                              if (val.length >= 3) val = val.slice(0,2) + '/' + val.slice(2)
                              if (val.length >= 6) val = val.slice(0,5) + '/' + val.slice(5)
                              val = val.slice(0, 10)
                              const parsed = parseDate(val)
                              updateAssignment(i, { start_date_input: val, ...(parsed && { start_date: parsed }) })
                            }}
                            placeholder="DD/MM/YYYY"
                            className={inputCls} style={inputStyle}
                            onFocus={e => e.target.style.borderColor = '#E3492B'}
                            onBlur={e => e.target.style.borderColor = '#0D3764'} />
                        </FormGroup>
                      </div>

                      <FormGroup label="notes">
                        <input type="text" value={a.notes || ''}
                          onChange={e => updateAssignment(i, 'notes', e.target.value)}
                          placeholder="optional" className={inputCls} style={inputStyle}
                          onFocus={e => e.target.style.borderColor = '#E3492B'}
                          onBlur={e => e.target.style.borderColor = '#0D3764'} />
                      </FormGroup>
                    </div>
                  </div>
                ))}

                <button onClick={addAssignment}
                  className="flex items-center justify-center gap-1.5 text-[13px] font-mono w-full py-2.5 px-3 border-2 cursor-pointer transition-all lowercase"
                  style={{ color: '#E3492B', background: 'transparent', borderColor: '#E3492B' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(227,73,43,0.06)'; e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}>
                  <Plus size={13} strokeWidth={2} />
                  add project assignment
                </button>
              </div>
            )}
          </div>
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
              cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="text-sm font-medium font-mono px-5 py-2.5 border-2 cursor-pointer bg-no text-white transition-all disabled:opacity-60 lowercase"
              style={{ borderColor: '#0D3764' }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.boxShadow = '4px 4px 0px #0D3764' }}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              {saving ? 'saving…' : 'save changes'}
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
      style={{ color: 'rgba(13,55,100,0.42)', borderBottom: '1px solid rgba(13,55,100,0.10)' }}>
      {children}
    </div>
  )
}

function FormGroup({ label, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11px] font-medium tracking-[0.09em] font-mono lowercase"
        style={{ color: 'rgba(13,55,100,0.42)' }}>{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'border-2 px-3 py-2 text-nb font-mono text-sm outline-none transition-colors w-full'
const inputStyle = { borderColor: '#0D3764', background: '#FFFFFF' }
