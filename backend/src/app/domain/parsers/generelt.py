"""
Parsers for Generelt tab data.

Port of featureInfoParser.ts — parseMatrikkelInfo, parseKommuneplan, parseKommunedelplan.
"""

import re

from app.domain.parsers._common import is_no_results as _is_no_results
from app.domain.parsers._common import is_service_exception as _is_service_exception
from app.domain.parsers._generelt_config import (
    KP_LABEL_MAP,
    KP_SKIP_KEYS,
    MATRIKKEL_LABEL_MAP,
    MATRIKKEL_SKIP_KEYS,
    PI_LABEL_MAP,
    PI_SKIP_KEYS,
)
from app.domain.types import GenereltData, KommuneplanData, PlanleggingIgangsattData

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_ISO_DATE_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})")
_KV_PATTERN = re.compile(r"^\s*(\S+)\s*=\s*'?(.+?)'?\s*$")


def _format_iso_date(value: str) -> str:
    """Convert ISO 8601 date string (YYYY-MM-DD…) to Norwegian DD.MM.YYYY."""
    m = _ISO_DATE_RE.match(value.strip())
    if m:
        return f"{m.group(3)}.{m.group(2)}.{m.group(1)}"
    return value


def _parse_kv_lines(
    raw: str,
    skip_keys: set[str],
    label_map: dict[str, str],
    *,
    apply_dates: bool = True,
    skip_geometry: bool = False,
) -> dict[str, str]:
    """Parse WMS text/plain key=value lines into a display dict.

    Args:
        raw: Raw WMS response text.
        skip_keys: Lowercase keys to exclude.
        label_map: Map from lowercase key → display label.
        apply_dates: Format ISO date values to DD.MM.YYYY.
        skip_geometry: Skip values that start with ``[GEOMETRY``.
    """
    details: dict[str, str] = {}
    for line in raw.split("\n"):
        line = line.strip()
        if not line:
            continue
        m = _KV_PATTERN.match(line)
        if not m:
            continue
        raw_key = m.group(1).strip().lower()
        raw_value = m.group(2).strip()
        if raw_key in skip_keys:
            continue
        if raw_key.startswith("kopidata."):
            continue
        if not raw_value or raw_value == "''" or raw_value.lower() == "null":
            continue
        if skip_geometry and raw_value.startswith("[GEOMETRY"):
            continue
        if apply_dates and _ISO_DATE_RE.match(raw_value):
            raw_value = _format_iso_date(raw_value)
        display_key = label_map.get(raw_key, m.group(1).strip())
        details[display_key] = raw_value
    return details


# ---------------------------------------------------------------------------
# Kommuneplan / Kommunedelplan  (DIBK NAP WMS — text/plain)
# ---------------------------------------------------------------------------


def parse_kommuneplan(raw: str | None) -> KommuneplanData | None:
    if not raw or not raw.strip():
        return None
    if _is_service_exception(raw) or _is_no_results(raw):
        return None

    # Parse all KV pairs first; extract semantic fields from the display dict.
    # _parse_kv_lines already applies date formatting and filtering.
    raw_kvs: dict[str, str] = {}
    for line in raw.split("\n"):
        m = _KV_PATTERN.match(line.strip())
        if not m:
            continue
        raw_kvs[m.group(1).strip().lower()] = m.group(2).strip()

    details = _parse_kv_lines(raw, KP_SKIP_KEYS, KP_LABEL_MAP)
    if not details:
        return None

    _formaal_keys = ("arealformalnavn", "arealformaalnavn", "arealformaal", "objekttype")
    formaal = next((raw_kvs[k] for k in _formaal_keys if k in raw_kvs), None)
    utnyttingsgrad = raw_kvs.get("utnyttingsgrad")

    return KommuneplanData(formaal=formaal, utnyttingsgrad=utnyttingsgrad, details=details)


def parse_kommunedelplan(raw: str | None) -> KommuneplanData | None:
    """Kommunedelplan uses the same DIBK NAP format as Kommuneplan."""
    return parse_kommuneplan(raw)


# ---------------------------------------------------------------------------
# Planlegging igangsatt  (DiBK plandata — text/plain)
# ---------------------------------------------------------------------------


def parse_planlegging_igangsatt(raw: str | None) -> PlanleggingIgangsattData | None:
    if not raw or not raw.strip():
        return None
    if _is_service_exception(raw) or _is_no_results(raw):
        return None

    raw_kvs: dict[str, str] = {}
    for line in raw.split("\n"):
        m = _KV_PATTERN.match(line.strip())
        if not m:
            continue
        raw_kvs[m.group(1).strip().lower()] = m.group(2).strip()

    details = _parse_kv_lines(raw, PI_SKIP_KEYS, PI_LABEL_MAP, skip_geometry=True)
    if not details:
        return None

    return PlanleggingIgangsattData(
        plannavn=raw_kvs.get("plannavn"),
        plantype=raw_kvs.get("plantype"),
        igangsettingsdato=raw_kvs.get("igangsettingsdato"),
        details=details,
    )


# ---------------------------------------------------------------------------
# Matrikkelkart / Teiger  (Geonorge — text/plain)
# ---------------------------------------------------------------------------


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

    details = _parse_kv_lines(raw, MATRIKKEL_SKIP_KEYS, MATRIKKEL_LABEL_MAP, apply_dates=False)

    return GenereltData(
        matrikkelInfo="\n".join(lines),
        details=details,
        kommuneplan=None,
        kommunedelplan=None,
    )
