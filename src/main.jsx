import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { PublicPipeline } from './components/PublicPipeline.jsx'
import DemoRoster from './DemoRoster.jsx' // LOCAL PREVIEW ONLY — remove with DemoRoster.jsx
import { DEMO_ENABLED, IS_DEMO_BUILD } from './lib/demoMode.js'

// Public, unauthenticated placement pipeline link — e.g. /?pipeline=<token>.
// Resolved once here, outside App, so App's auth flow never has to know about it.
const params = new URLSearchParams(window.location.search)
const pipelineToken = params.get('pipeline')
// DEMO_ENABLED is false in a normal production build, so the demo route cannot
// be reached on a deployed site. ?demo=placements | roster
const demoParam = params.get('demo')
const explicitDemo = DEMO_ENABLED && (demoParam === 'placements' || demoParam === 'roster')

// In the shareable prototype bundle there is no sign-in and no database, so the
// demo IS the app — anything that isn't a share link lands on it directly.
const isDemo = explicitDemo || (IS_DEMO_BUILD && !pipelineToken)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isDemo
      ? <DemoRoster initialPage={demoParam === 'roster' ? 'roster' : 'placements'} />
      : pipelineToken ? <PublicPipeline token={pipelineToken} /> : <App />}
  </StrictMode>,
)
