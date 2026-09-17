// LOCAL PREVIEW / PROTOTYPE ONLY — delete with demoData.js and DemoRoster.jsx.
//
// Demo routes are available in two situations:
//   1. `npm run dev`                — while working locally
//   2. `npm run build:demo`         — the shareable prototype bundle
//
// A normal `npm run build` sets neither, so these constants fold to `false`
// and every demo branch is dropped from the bundle. That keeps the fake data
// and the write-blocking guards out of the real deployed app.

export const IS_DEMO_BUILD = import.meta.env.VITE_DEMO === '1'
export const DEMO_ENABLED = import.meta.env.DEV || IS_DEMO_BUILD
