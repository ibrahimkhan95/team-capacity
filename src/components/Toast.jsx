import { useEffect, useState } from 'react'

let _show = null
export function showToast(msg) { _show?.(msg) }

export function Toast() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    _show = (m) => {
      setMsg(m)
      setVisible(true)
      setTimeout(() => setVisible(false), 2500)
    }
    return () => { _show = null }
  }, [])

  return (
    <div
      className="fixed bottom-6 right-6 bg-nb rounded-lg px-5 py-3 text-xs text-white z-[200] font-mono pointer-events-none transition-all duration-200"
      style={{
        boxShadow: '0 8px 32px rgba(13,55,100,0.20)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
      }}
    >
      {msg}
    </div>
  )
}
