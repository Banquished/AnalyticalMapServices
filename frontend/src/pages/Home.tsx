import { Map } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="h-full overflow-y-auto flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-text-on-accent">
            <Map size={32} strokeWidth={1.8} />
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-text tracking-tight">
          Analytical Map Services
        </h1>
        <p className="text-text-muted text-sm max-w-xs">
          Eiendomsanalyse basert på offentlige geospatiale data fra norske myndigheter.
        </p>
        <Link to="/map" className="btn btn-primary btn-md inline-flex">
          Åpne kart
        </Link>
      </div>
    </div>
  )
}
