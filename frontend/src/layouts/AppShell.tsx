import { Outlet } from 'react-router-dom'
import { Header } from '../shared/ui/Header'
import { Sidebar } from '../shared/ui/Sidebar'

/**
 * Root application shell.
 * - Fixed h-screen with overflow-hidden so the map page fills the remaining space.
 * - Regular pages add their own overflow-y-auto scroll container.
 */
export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
