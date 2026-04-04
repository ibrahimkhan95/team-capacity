import { useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function Auth() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setLoading(false)
    if (err) setError(err.message)
    else setSent(true)
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-bg">
      <div className="bg-sur border rounded-2xl p-10 w-full max-w-sm"
        style={{ borderColor: 'rgba(13,55,100,0.10)', boxShadow: '0 8px 32px rgba(13,55,100,0.12)' }}>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-no rounded-md flex items-center justify-center flex-shrink-0">
            <span className="font-serif text-white text-sm">N</span>
          </div>
          <div>
            <div className="font-serif text-nb text-lg leading-none">nurture</div>
            <div className="text-[10px] mt-0.5 font-mono tracking-wider" style={{ color: 'rgba(13,55,100,0.42)' }}>
              squad capacity
            </div>
          </div>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(27,153,139,0.12)' }}>
              <Check size={18} color="#1B998B" strokeWidth={1.5} />
            </div>
            <p className="font-serif text-nb text-base mb-1">Check your email</p>
            <p className="text-[13px] font-mono" style={{ color: 'rgba(13,55,100,0.42)' }}>
              We sent a magic link to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="font-serif text-nb text-base mb-1">Sign in</p>
              <p className="text-[13px] font-mono" style={{ color: 'rgba(13,55,100,0.42)' }}>
                Enter your email to receive a magic link
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-medium tracking-widest uppercase font-mono"
                style={{ color: 'rgba(13,55,100,0.42)' }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="bg-bg border rounded-lg px-3 py-2 text-sm font-mono text-nb outline-none transition-colors"
                style={{ borderColor: 'rgba(13,55,100,0.10)' }}
                onFocus={e => e.target.style.borderColor = '#E3492B'}
                onBlur={e => e.target.style.borderColor = 'rgba(13,55,100,0.10)'}
              />
            </div>
            {error && (
              <p className="text-[13px] font-mono" style={{ color: '#E3492B' }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-no text-white text-sm font-medium font-mono rounded-lg py-2.5 cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading ? 'sending…' : 'send magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
