import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { initTheme } from './stores/themeStore'
import { ToastContainer } from './shared/ui/toast'
import { router } from './router'

// Sync DOM with persisted theme before first render (prevents flash)
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <ToastContainer />
  </StrictMode>,
)
