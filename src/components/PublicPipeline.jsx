import { useState, useEffect } from 'react'
import { Check, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PLACEMENT_STAGES, PLACEMENT_STAGE_LABELS, PLACEMENT_STAGE_DESCRIPTIONS, placementStageIndex, formatDate } from '../lib/utils'
import { findDemoPlacement } from '../demoData' // LOCAL PREVIEW ONLY — remove with demoData.js
import { DEMO_ENABLED } from '../lib/demoMode'

export function PublicPipeline({ token }) {
  const [placement, setPlacement] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)

  useEffect(() => {
    // LOCAL PREVIEW ONLY — resolves the demo roster's share tokens without
    // Supabase, so the copy-link button is testable end to end.
    // import.meta.env.DEV is false in any production build, so this is stripped there.
    if (DEMO_ENABLED) {
      const demo = findDemoPlacement(token)
      if (demo) { setPlacement(demo); setLoading(false); return }
    }
    supabase.rpc('get_placement_by_token', { token }).then(({ data, error }) => {
      if (error || !data || !data.length) { setNotFound(true); setLoading(false); return }
      setPlacement(data[0])
      setLoading(false)
    })
  }, [token])

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: '#F4F4F4' }}>
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src="https://cdn.prod.website-files.com/617123e41df66d0e7f6dbea7/61a7b46ff625c1d97f6924a0_Logo-mark.svg"
            alt="Nurture"
            className="w-8 h-8"
          />
          <div className="text-left">
            <div className="font-serif text-nb text-lg leading-none">nurture</div>
            <div className="text-[10px] mt-0.5 font-mono tracking-wider lowercase" style={{ color: 'rgba(13,55,100,0.60)' }}>
              placement pipeline
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center text-xs font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>loading…</div>
        )}

        {!loading && notFound && (
          <div className="bg-sur border-2 p-10 text-center" style={{ borderColor: '#0D3764' }}>
            <p className="font-serif text-nb text-base mb-2">link not found</p>
            <p className="text-[13px] font-mono" style={{ color: 'rgba(13,55,100,0.60)' }}>
              this placement link is invalid or has been removed.
            </p>
          </div>
        )}

        {!loading && placement && (() => {
          // The RPC returns the team as JSON; older rows may still only carry a
          // single member_name.
          const team = Array.isArray(placement.designers)
            ? placement.designers
            : placement.member_name
              ? [{ member_name: placement.member_name, pct: null }]
              : []
          return (
          <div className="bg-sur border-2 overflow-hidden" style={{ borderColor: '#0D3764' }}>
            {/* The project is the anchor — designers may not be assigned yet,
                so it leads and the team is secondary. */}
            <div className="px-7 py-6" style={{ borderBottom: '1px solid rgba(13,55,100,0.10)' }}>
              <h1 className="font-serif text-[22px] font-normal text-nb">{placement.project_name}</h1>
              {team.length === 0 ? (
                <p className="text-[12px] font-mono mt-1 lowercase" style={{ color: 'rgba(13,55,100,0.60)' }}>
                  designers being assigned
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {team.map((d, i) => (
                    <span key={i}
                      className="inline-flex items-center gap-1.5 font-mono text-[12px] font-medium px-2.5 py-[3px] whitespace-nowrap"
                      style={{ background: 'rgba(100,116,139,0.10)', color: '#334155' }}>
                      {d.member_name}
                      {d.pct != null && <span style={{ color: '#15803D' }}>{d.pct}%</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="px-7 py-6 flex flex-col gap-0">
              {PLACEMENT_STAGES.map((s, i) => {
                const currentIdx = placementStageIndex(placement.stage)
                const done    = i < currentIdx
                const current = i === currentIdx
                const isLast  = i === PLACEMENT_STAGES.length - 1
                const color   = done ? '#1B998B' : current ? '#E3492B' : 'rgba(13,55,100,0.25)'
                return (
                  <div key={s} className="flex gap-3">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <span className="w-6 h-6 border-2 flex items-center justify-center text-[11px] font-mono"
                        style={{ borderColor: color, color: done ? '#FFFFFF' : color, background: done ? '#1B998B' : 'transparent' }}>
                        {done ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                      </span>
                      {!isLast && <span className="w-[2px] flex-1 my-1" style={{ background: done ? '#1B998B' : 'rgba(13,55,100,0.15)', minHeight: 28 }} />}
                    </div>
                    <div className="pb-6">
                      <p className="text-[13px] font-mono lowercase" style={{ color: current || done ? '#0D3764' : 'rgba(13,55,100,0.45)' }}>
                        {PLACEMENT_STAGE_LABELS[s]}
                      </p>
                      <p className="text-[11px] font-mono mt-1 leading-relaxed" style={{ color: 'rgba(13,55,100,0.50)' }}>
                        {PLACEMENT_STAGE_DESCRIPTIONS[s]}
                      </p>
                      {/* Brief link stays visible once the stage is reached,
                          not just while it's the current one. */}
                      {s === 'brief' && (done || current) && placement.brief_url && (
                        <a href={placement.brief_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[12px] font-mono mt-2 px-2.5 py-1.5 border-2 lowercase transition-all"
                          style={{ borderColor: '#0D3764', color: '#0D3764' }}
                          onMouseEnter={e => e.currentTarget.style.boxShadow = '2px 2px 0px #0D3764'}
                          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                          <ExternalLink size={12} strokeWidth={2} />
                          view design brief
                        </a>
                      )}
                      {current && s === 'onboarding_set' && placement.onboarding_date && (
                        <p className="text-[12px] font-mono mt-2 font-medium" style={{ color: '#1B998B' }}>
                          onboarding: {formatDate(placement.onboarding_date)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          )
        })()}
      </div>
    </div>
  )
}
