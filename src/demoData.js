// LOCAL PREVIEW ONLY — shared mock data for the demo routes.
// Delete alongside DemoRoster.jsx and the demo branches in main.jsx /
// PublicPipeline.jsx before merging.

const BRIEF_DOC = 'https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit'

export const demoProjects = [
  { id: 'p1', name: 'Client Phoenix',  tier: 'coach',            internal: false, brief_url: BRIEF_DOC },
  { id: 'p2', name: 'Client Meridian', tier: 'empower',          internal: false, brief_url: BRIEF_DOC },
  { id: 'p3', name: 'Client Atlas',    tier: 'active_oversight', internal: false, brief_url: BRIEF_DOC },
  { id: 'p4', name: 'Client Juniper',  tier: 'monitor',          internal: false, brief_url: BRIEF_DOC },
  { id: 'p5', name: 'NurtureOps',      tier: 'monitor',          internal: true,  brief_url: '' },
]

export const demoMembers = [
  // No placement yet — shows "start placement", and is 100% allocated so the
  // over-allocation warning fires when the drawer opens.
  {
    id: 'm1', name: 'Ayesha Raza', seniority: 'XDM', squad: 'Squad 1', status: 'On Project', notes: '',
    assignments: [{ id: 'a1', project: 'Client Phoenix', engagement: 'Full Time (100%)', pct: 100, start_date: '2026-06-01', notes: '', project_info: demoProjects[0] }],
  },
  // No placement, on bench — no warning when the drawer opens.
  {
    id: 'm2', name: 'Bilal Aslam', seniority: 'Mid', squad: 'Squad 1', status: 'Bench', notes: '',
    assignments: [],
  },
  // One member per pipeline stage, so every colour + icon is visible at once.
  {
    id: 'm3', name: 'Hira Nadeem', seniority: 'Senior', squad: 'Squad 1', status: 'Bench', notes: '',
    assignments: [],
  },
  {
    id: 'm4', name: 'Zoya Iqbal', seniority: 'Mid', squad: 'Squad 1', status: 'On Project', notes: '',
    assignments: [{ id: 'a4', project: 'Client Meridian', engagement: 'Part Time (50%)', pct: 50, start_date: '2026-04-10', notes: '', project_info: demoProjects[1] }],
  },
  {
    id: 'm5', name: 'Faisal Khan', seniority: 'Junior', squad: 'Squad 1', status: 'Bench', notes: '',
    assignments: [],
  },
  {
    id: 'm6', name: 'Mariam Shah', seniority: 'Senior', squad: 'Squad 1', status: 'Bench', notes: '',
    assignments: [],
  },
  // Also at stage 4, but with an onboarding date in the past — exercises the
  // "date has passed, finish this placement?" alert.
  {
    id: 'm9', name: 'Danish Ali', seniority: 'Mid', squad: 'Squad 1', status: 'Bench', notes: '',
    assignments: [],
  },
  // Other squads — only here so the XDM point-of-contact dropdown has options
  // beyond Squad 1's own XDM.
  {
    id: 'm7', name: 'Sana Tariq', seniority: 'XDM', squad: 'Squad 2', status: 'On Project', notes: '',
    assignments: [{ id: 'a7', project: 'NurtureOps', engagement: 'Part Time (50%)', pct: 50, start_date: '2026-03-15', notes: '', project_info: demoProjects[4] }],
  },
  {
    id: 'm8', name: 'Omar Siddiqui', seniority: 'XDM', squad: 'Squad 3', status: 'On Project', notes: '',
    assignments: [{ id: 'a8', project: 'Client Juniper', engagement: 'Full Time (100%)', pct: 100, start_date: '2026-05-05', notes: '', project_info: demoProjects[3] }],
  },
]

// One placement per stage — brief → squad_poc → intro_call → onboarding_set.
// share_token values are what the roster's copy-link button hands out, so
// PublicPipeline resolves them locally instead of hitting Supabase.
export const demoPlacements = [
  // Stage 1: brief written, designer not decided yet — the case the whole
  // project-first model exists for.
  {
    id: 'pl1', member_id: null, member_name: '', designers: [],
    project_id: 'p3', project_name: 'Client Atlas',
    stage: 'brief', squad: '', point_of_contact: '',
    arbisoft_contact: '', timeline_notes: '', onboarding_date: null,
    share_token: 'demo-token-1', created_at: new Date().toISOString(),
  },
  {
    id: 'pl2', member_id: 'm4', member_name: 'Zoya Iqbal',
    designers: [
      { member_id: 'm4', member_name: 'Zoya Iqbal', squad: 'Squad 1', pct: 50, engagement: 'Part Time (50%)' },
    ],
    project_id: 'p2', project_name: 'Client Meridian',
    stage: 'squad_poc', squad: 'Squad 1', point_of_contact: 'Ayesha Raza',
    arbisoft_contact: '', timeline_notes: '', onboarding_date: null,
    share_token: 'demo-token-2', created_at: new Date().toISOString(),
  },
  {
    id: 'pl3', member_id: 'm5', member_name: 'Faisal Khan',
    // Several designers across squads, each at their own capacity.
    designers: [
      { member_id: 'm5', member_name: 'Faisal Khan',   squad: 'Squad 1', pct: 100, engagement: 'Full Time (100%)' },
      { member_id: 'm7', member_name: 'Sana Tariq',    squad: 'Squad 2', pct: 50,  engagement: 'Part Time (50%)'  },
      { member_id: 'm8', member_name: 'Omar Siddiqui', squad: 'Squad 3', pct: 25,  engagement: 'Part Time (25%)'  },
    ],
    project_id: 'p1', project_name: 'Client Phoenix',
    stage: 'intro_call', squad: 'Squad 1', point_of_contact: 'Sana Tariq',
    arbisoft_contact: 'Usman Sheikh', timeline_notes: 'Kickoff targeted for early Oct.',
    onboarding_date: null,
    share_token: 'demo-token-3', created_at: new Date().toISOString(),
  },
  {
    id: 'pl4', member_id: 'm6', member_name: 'Mariam Shah',
    designers: [
      { member_id: 'm6', member_name: 'Mariam Shah', squad: 'Squad 1', pct: 100, engagement: 'Full Time (100%)' },
    ],
    project_id: 'p4', project_name: 'Client Juniper',
    stage: 'onboarding_set', squad: 'Squad 1', point_of_contact: 'Omar Siddiqui',
    arbisoft_contact: 'Hina Raza', timeline_notes: 'Two-week ramp agreed.',
    onboarding_date: '2026-09-15',
    share_token: 'demo-token-4', created_at: new Date().toISOString(),
  },
  {
    id: 'pl5', member_id: 'm9', member_name: 'Danish Ali',
    designers: [
      { member_id: 'm9', member_name: 'Danish Ali', squad: 'Squad 1', pct: 75, engagement: 'Part Time (75%)' },
    ],
    project_id: 'p1', project_name: 'Client Phoenix',
    stage: 'onboarding_set', squad: 'Squad 1', point_of_contact: 'Ayesha Raza',
    arbisoft_contact: 'Bilal Ahmed', timeline_notes: 'Onboarded ahead of schedule.',
    // Deliberately in the past relative to today so the alert shows.
    onboarding_date: '2026-08-01',
    share_token: 'demo-token-5', created_at: new Date().toISOString(),
  },
]

// Mirrors what get_placement_by_token now returns: the narrow public shape,
// with brief_url joined in from the project rather than the placement.
// `?pipeline=demo` is kept as an alias for one of them.
export function findDemoPlacement(token) {
  const pl = token === 'demo'
    ? demoPlacements[2]
    : demoPlacements.find(p => p.share_token === token)
  if (!pl) return null

  const project = demoProjects.find(p => p.id === pl.project_id)
  return {
    designers:       (pl.designers || []).map(d => ({ member_name: d.member_name, pct: d.pct })),
    project_name:    pl.project_name,
    stage:           pl.stage,
    onboarding_date: pl.onboarding_date,
    brief_url:       project?.brief_url || '',
  }
}
