import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Auth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleSignIn() {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-bg">
      <div className="bg-sur border rounded-2xl p-10 w-full max-w-sm"
        style={{ borderColor: 'rgba(13,55,100,0.10)', boxShadow: '0 8px 32px rgba(13,55,100,0.12)' }}>

        <div className="flex items-center gap-3 mb-8">
          <img
            src="https://cdn.prod.website-files.com/617123e41df66d0e7f6dbea7/61a7b46ff625c1d97f6924a0_Logo-mark.svg"
            alt="Nurture"
            className="w-8 h-8 flex-shrink-0"
          />
          <div>
            <div className="font-serif text-nb text-lg leading-none">nurture</div>
            <div className="text-[10px] mt-0.5 font-mono tracking-wider" style={{ color: 'rgba(13,55,100,0.42)' }}>
              squad capacity
            </div>
          </div>
        </div>

        <p className="font-serif text-nb text-base mb-1">Sign in</p>
        <p className="text-[13px] font-mono mb-6" style={{ color: 'rgba(13,55,100,0.42)' }}>
          Use your Arbisoft Google account to continue.
        </p>

        {error && (
          <p className="text-[13px] font-mono mb-4" style={{ color: '#E3492B' }}>{error}</p>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border rounded-lg py-2.5 text-sm font-mono transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ borderColor: 'rgba(13,55,100,0.15)', color: '#0D3764' }}
        >
          <GoogleIcon />
          {loading ? 'redirecting…' : 'sign in with Google'}
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  )
}
