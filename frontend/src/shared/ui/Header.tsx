import { UserChip } from './UserChip'

export function Header() {
  return (
    <header className="app-header app-gutter shrink-0 relative z-[2000]">
      <div className="ml-auto flex items-center gap-2">
        <UserChip />
      </div>
    </header>
  )
}
