'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface Props {
  content: React.ReactNode
  side?: 'right' | 'left'
}

export default function HelpTooltip({ content, side = 'right' }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  // Recalcule la position si la fenêtre défile ou est redimensionnée pendant que le tooltip est ouvert
  useEffect(() => {
    if (!open) return
    function reposition() {
      if (!btnRef.current) return
      const rect = btnRef.current.getBoundingClientRect()
      const tooltipWidth = 256 // w-64
      const left = side === 'right'
        ? Math.min(rect.right + 8, window.innerWidth - tooltipWidth - 8)
        : Math.max(rect.left - tooltipWidth - 8, 8)
      setPos({ top: rect.top, left })
    }
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [open, side])

  function handleToggle() {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const tooltipWidth = 256
    const left = side === 'right'
      ? Math.min(rect.right + 8, window.innerWidth - tooltipWidth - 8)
      : Math.max(rect.left - tooltipWidth - 8, 8)
    setPos({ top: rect.top, left })
    setOpen(v => !v)
  }

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center transition shrink-0 ${
          open
            ? 'bg-white text-black'
            : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600 hover:text-white'
        }`}
        title="Aide"
      >
        ?
      </button>

      {open && (
        <div
          className="fixed z-9999 w-64 bg-neutral-900 border border-neutral-700 rounded-xl p-3 shadow-2xl text-xs text-neutral-300 leading-relaxed"
          style={{ top: pos.top, left: pos.left }}
        >
          <button
            onClick={() => setOpen(false)}
            className="absolute top-2 right-2 text-neutral-600 hover:text-white transition"
          >
            <X className="w-3 h-3" />
          </button>
          {content}
        </div>
      )}
    </div>
  )
}
