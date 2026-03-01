import { createBrowserRouter } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import { MapPageView } from './features/map/MapPageView'
import About from './pages/About'
import Changelog from './pages/Changelog'
import Home from './pages/Home'
import Settings from './pages/Settings'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'map', element: <MapPageView /> },
      { path: 'about', element: <About /> },
      { path: 'changelog', element: <Changelog /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
])
