import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../stores/themeStore'

export default function Settings() {
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-xl font-semibold text-text mb-1">Innstillinger</h1>
        <p className="text-sm text-text-muted mb-8">Applikasjonsinnstillinger</p>

        <div className="card card-pad-md space-y-4">
          <h2 className="text-sm font-semibold text-text">Tema</h2>
          <p className="text-xs text-text-muted">
            Velg om applikasjonen skal bruke mørkt eller lyst tema.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`btn btn-sm flex items-center gap-2 ${theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Moon size={14} />
              Mørkt
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`btn btn-sm flex items-center gap-2 ${theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Sun size={14} />
              Lyst
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
