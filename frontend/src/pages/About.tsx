export default function About() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="text-xl font-semibold text-text mb-1">Om applikasjonen</h1>
        <p className="text-sm text-text-muted mb-8">Analytical Map Services</p>

        <div className="card card-pad-md space-y-4">
          <h2 className="text-sm font-semibold text-text">Hva er dette?</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            Analytical Map Services er en nettapplikasjon for eiendomsanalyse som
            aggregerer data fra 13+ offentlige geospatiale datakilder — inkludert NVE,
            NGU, Riksantikvaren, Miljødirektoratet, Kartverket og Geonorge — i ett
            samlet grensesnitt.
          </p>

          <h2 className="text-sm font-semibold text-text">Datakilder</h2>
          <ul className="text-sm text-text-muted space-y-1">
            <li>Kartverket Eiendom — matrikkeldata og grenser</li>
            <li>Geonorge Adresser — adressesøk og geokoding</li>
            <li>NVE — flomsoner og skredfare</li>
            <li>NGU — radon, løsmasser og berggrunn</li>
            <li>Riksantikvaren — kulturminner</li>
            <li>Miljødirektoratet — støysoner (veg)</li>
            <li>Bane NOR — støysoner (jernbane)</li>
            <li>Forsvaret — støysoner (militær)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
