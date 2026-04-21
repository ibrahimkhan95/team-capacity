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
      className="fixed bottom-6 right-6 bg-nb border-2 px-5 py-3 text-xs text-white z-[200] font-mono pointer-events-none transition-all duration-200"
      style={{
        borderColor: '#0D3764',
        boxShadow: '4px 4px 0px #F8A978',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
      }}
    >
      {msg}
    </div>
  )
}
