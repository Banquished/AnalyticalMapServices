import { LogOut, Moon, Sun, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useThemeStore } from '../../stores/themeStore'

export function UserChip() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useThemeStore()

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-text-on-accent hover:opacity-90 transition-opacity cursor-pointer"
        aria-label="Brukermeny"
        aria-expanded={open}
      >
        <User size={15} strokeWidth={2.2} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-[9999] w-52 rounded-lg border border-border-subtle bg-surface shadow-lg overflow-hidden">
          {/* User info header */}
          <div className="px-3 py-2.5 border-b border-border-subtle">
            <p className="text-xs font-semibold text-text leading-none mb-0.5">Bruker</p>
            <p className="text-xs text-text-muted">Innlogget</p>
          </div>

          {/* Actions */}
          <div className="p-1">
            <button
              type="button"
              onClick={() => { toggleTheme(); setOpen(false) }}
              className="menu-item w-full"
            >
              {theme === 'dark'
                ? <Sun size={14} strokeWidth={2} />
                : <Moon size={14} strokeWidth={2} />}
              <span>{theme === 'dark' ? 'Bytt til lyst tema' : 'Bytt til mørkt tema'}</span>
            </button>
          </div>

          <div className="menu-separator" />

          <div className="p-1">
            <button type="button" className="menu-item w-full text-danger">
              <LogOut size={14} strokeWidth={2} />
              <span>Logg ut</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
