import { createClient } from '@supabase/supabase-js'
import { IS_DEMO_BUILD } from './demoMode'

// The prototype bundle runs entirely on mock data and never reaches Supabase,
// so it's built without credentials. createClient throws on a missing URL, so
// give it inert placeholders rather than leaving it undefined.
const url = import.meta.env.VITE_SUPABASE_URL || (IS_DEMO_BUILD ? 'https://demo.invalid' : undefined)
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || (IS_DEMO_BUILD ? 'demo-anon-key' : undefined)

export const supabase = createClient(url, key)
