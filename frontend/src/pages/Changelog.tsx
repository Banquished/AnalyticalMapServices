const ENTRIES = [
  {
    version: '0.1.0',
    date: '2026-02-28',
    changes: [
      'Initiell oppsett med Vite + React + TypeScript',
      'React Router, Tailwind CSS og Zustand konfigurert',
      'Kartvisning med Leaflet og react-leaflet',
      'Eiendomssøk via Kartverket og Geonorge',
      'WMS GetFeatureInfo for 11 datakilder',
      'ArcGIS REST-integrasjon (Riksantikvaren, Miljødirektoratet)',
      'App-skall med sidefelt og topptekst',
      'Mørkt/lyst tema',
    ],
  },
] as const

export default function Changelog() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-xl font-semibold text-text mb-1">Endringslogg</h1>
        <p className="text-sm text-text-muted mb-8">Versionshistorikk for Analytical Map Services</p>

        <div className="space-y-6">
          {ENTRIES.map((entry) => (
            <div key={entry.version} className="card card-pad-md">
              <div className="flex items-center gap-3 mb-3">
                <span className="badge badge-neutral badge-sm font-mono">
                  v{entry.version}
                </span>
                <span className="text-xs text-text-muted">{entry.date}</span>
              </div>
              <ul className="space-y-1.5">
                {entry.changes.map((c) => (
                  <li key={c} className="flex items-start gap-2 text-sm text-text-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
