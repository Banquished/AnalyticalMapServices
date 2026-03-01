"""
Parsers for Generelt tab data.

Port of featureInfoParser.ts — parseMatrikkelInfo, parseKommuneplan, parseKommunedelplan.
"""

import re

from app.domain.types import GenereltData, KommuneplanData

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _is_service_exception(raw: str) -> bool:
    return "ServiceException" in raw or "msShapefileOpen" in raw


def _is_no_results(raw: str) -> bool:
    lower = raw.lower()
    return "no features" in lower or "search returned no results" in lower


# ---------------------------------------------------------------------------
# Kommuneplan / Kommunedelplan  (DIBK NAP WMS — text/plain)
# ---------------------------------------------------------------------------

_KP_LABEL_MAP: dict[str, str] = {
    "arealformalkode": "Arealformålkode",
    "arealformalnavn": "Arealformål",
    "arealformaal": "Arealformål",
    "arealbruksstatus": "Arealbruksstatus",
    "beskrivelse": "Beskrivelse",
    "omradenavn": "Områdenavn",
    "utnyttingsgrad": "Utnyttingsgrad",
    "utnyttingstype": "Utnyttingstype",
    "utnytting.utnyttingstype": "Utnyttingstype",
    "utnytting.utnyttingstall": "Utnyttingstall",
    "kommunenavn": "Kommune",
    "planidentifikasjon": "Plan-ID",
    "arealplanid.planidentifikasjon": "Plan-ID",
    "plannavn": "Plannavn",
    "planstatus": "Planstatus",
    "ikrafttredelsesdato": "Ikrafttredelse",
}

_KP_SKIP_KEYS: set[str] = {
    "getfeatureinfo results:",
    "globalid",
    "identifikasjon",
    "oppdateringsdato",
    "datafangstdato",
    "navnerom",
    "versjonid",
    "objid",
    "objekttypenavn",
    "geometri",
    "eierform",
    "utnyttingsholdsareal",
    "arealplanid",
    "arealplanid.kommunenummer",
    "arealplanid.landkode",
    "identifikasjon.lokalid",
    "identifikasjon.versjonid",
    "identifikasjon.navnerom",
    "forstedigitaliseringsdato",
    "utnytting.utnyttingstall_minimum",
}


def parse_kommuneplan(raw: str | None) -> KommuneplanData | None:
    if not raw or not raw.strip():
        return None
    if _is_service_exception(raw):
        return None
    if _is_no_results(raw):
        return None

    lines = [line.strip() for line in raw.split("\n") if line.strip()]
    if not lines:
        return None

    formaal: str | None = None
    utnyttingsgrad: str | None = None
    details: dict[str, str] = {}

    for line in lines:
        m = re.match(r"^\s*(\S+)\s*=\s*'?(.+?)'?\s*$", line)
        if not m:
            continue
        raw_key = m.group(1).strip().lower()
        raw_value = m.group(2).strip()

        if raw_key in _KP_SKIP_KEYS:
            continue
        if raw_key.startswith("kopidata."):
            continue
        if not raw_value or raw_value == "''" or raw_value.lower() == "null":
            continue

        if raw_key in ("arealformalnavn", "arealformaalnavn", "arealformaal", "objekttype"):
            formaal = raw_value
        elif raw_key == "utnyttingsgrad":
            utnyttingsgrad = raw_value

        display_key = _KP_LABEL_MAP.get(raw_key, m.group(1).strip())
        details[display_key] = raw_value

    if not details and formaal is None:
        return None

    return KommuneplanData(formaal=formaal, utnyttingsgrad=utnyttingsgrad, details=details)


def parse_kommunedelplan(raw: str | None) -> KommuneplanData | None:
    """Kommunedelplan uses the same DIBK NAP format as Kommuneplan."""
    return parse_kommuneplan(raw)


# ---------------------------------------------------------------------------
# Matrikkelkart / Teiger  (Geonorge — text/plain)
# ---------------------------------------------------------------------------

_MATRIKKEL_SKIP_KEYS: set[str] = {
    "getfeatureinfo results:",
    "representasjonspunkt",
    "uuidteig",
    "globalid",
    "navnerom",
    "versjonid",
    "malemetode",
    "noyaktighet",
}

_MATRIKKEL_LABEL_MAP: dict[str, str] = {
    "kommunenummer": "Kommunenummer",
    "kommunenavn": "Kommune",
    "matrikkelnummertekst": "Matrikkel",
    "lagretberegnetareal": "Areal (m²)",
    "datafangstdato": "Datafangst",
    "oppdateringsdato": "Sist oppdatert",
    "noyaktighetsklasseteig": "Nøyaktighetsklasse",
    "teigmedflerematrikkelenheter": "Flere matrikkelenheter",
    "tvist": "Tvist",
    "objtype": "Type",
    "teigid": "Teig-ID",
    "arealmerknadtekst": "Arealanmerkning",
    "uregistrertjordsameie": "Uregistrert jordsameie",
    "avklarteiere": "Avklart eiere",
}


def parse_matrikkel_info(raw: str | None) -> GenereltData | None:
    if not raw or not raw.strip():
        return None

    if _is_service_exception(raw):
        return GenereltData(
            matrikkelInfo="",
            details={},
            serviceError=(
                "Matrikkelkart-tjenesten returnerte en serverfeil. "
                "Tjenesten kan være midlertidig utilgjengelig."
            ),
            kommuneplan=None,
            kommunedelplan=None,
        )

    if _is_no_results(raw):
        return None

    lines = [line.strip() for line in raw.split("\n") if line.strip()]
    if not lines:
        return None

    details: dict[str, str] = {}
    for line in lines:
        m = re.match(r"^\s*(\S+)\s*=\s*'?(.+?)'?\s*$", line)
        if not m:
            continue
        raw_key = m.group(1).strip().lower()
        raw_value = m.group(2).strip()
        if raw_key in _MATRIKKEL_SKIP_KEYS:
            continue
        if not raw_value or raw_value == "''":
            continue
        display_key = _MATRIKKEL_LABEL_MAP.get(raw_key, m.group(1).strip())
        details[display_key] = raw_value

    return GenereltData(
        matrikkelInfo="\n".join(lines),
        details=details,
        kommuneplan=None,
        kommunedelplan=None,
    )
