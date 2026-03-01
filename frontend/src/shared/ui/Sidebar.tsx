import {
  ChevronLeft,
  ChevronRight,
  History,
  Info,
  Map,
  Settings,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useSidebarStore } from '../../stores/sidebarStore'

const NAV_ITEMS = [
  { to: '/map', icon: Map, label: 'Kart' },
  { to: '/about', icon: Info, label: 'Om applikasjonen' },
  { to: '/changelog', icon: History, label: 'Endringslogg' },
  { to: '/settings', icon: Settings, label: 'Innstillinger' },
] as const

export function Sidebar() {
  const { collapsed, toggle } = useSidebarStore()

  return (
    <aside
      className="app-sidebar"
      data-collapsed={collapsed ? 'true' : undefined}
      aria-label="Sidefelt"
    >
      {/* Brand row — matches header height */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-link">
          <span className="sidebar-icon text-accent">
            <Map size={18} strokeWidth={2} />
          </span>
          <span className="sidebar-link-label text-xs font-bold tracking-widest uppercase text-text-muted">
            AMS
          </span>
        </span>
      </div>

      {/* Primary navigation */}
      <nav className="sidebar-nav sidebar-nav--primary flex-1" aria-label="Navigasjon">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
          >
            <span className="sidebar-icon">
              <Icon size={17} strokeWidth={1.8} />
            </span>
            <span className="sidebar-link-label text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="sidebar-nav sidebar-nav--secondary">
        <div className="sidebar-divider sidebar-divider--tight" />
        <button
          type="button"
          onClick={toggle}
          title={collapsed ? 'Utvid sidefelt' : 'Skjul sidefelt'}
          className="sidebar-link sidebar-link-inactive sidebar-collapse cursor-pointer"
        >
          <span className="sidebar-icon">
            {collapsed
              ? <ChevronRight size={17} strokeWidth={1.8} />
              : <ChevronLeft size={17} strokeWidth={1.8} />}
          </span>
          <span className="sidebar-link-label text-sm">Skjul</span>
        </button>
      </div>
    </aside>
  )
}
