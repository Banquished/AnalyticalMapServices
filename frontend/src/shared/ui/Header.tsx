import { Map } from 'lucide-react'
import { Link } from 'react-router-dom'
import { UserChip } from './UserChip'

export function Header() {
  return (
    <header className="app-header app-gutter shrink-0 relative z-[2000]">
      <Link
        to="/"
        className="flex items-center gap-2.5 no-underline hover:no-underline"
        aria-label="Hjem"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-text-on-accent">
          <Map size={15} strokeWidth={2.2} />
        </span>
        <span className="text-sm font-semibold text-text tracking-tight hidden sm:block">
          Analytical Map Services
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <UserChip />
      </div>
    </header>
  )
}
