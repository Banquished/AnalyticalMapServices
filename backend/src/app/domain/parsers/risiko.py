"""
Parsers for Risiko tab data.

Port of featureInfoParser.ts — radon, losmasse, berggrunn, kulturminner,
støy (veg/jernbane/militær), naturvern, grunnforurensning.
"""

import contextlib
import re
from datetime import UTC, datetime
from typing import Literal

from app.domain.types import (
    BerggrunData,
    DataFreshness,
    GrunnforurensningData,
    GrunnforurensningItem,
    KulturminneData,
    KulturminneItem,
    LosmasseData,
    NaturvernData,
    NaturvernItem,
    RadonResult,
    StoyData,
    StoyJernbaneItem,
    StoyMilitarItem,
    StoyVegItem,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _is_service_exception(raw: str) -> bool:
    return "ServiceException" in raw or "msShapefileOpen" in raw


def _is_no_results(raw: str) -> bool:
    lower = raw.lower()
    return "no features" in lower or "search returned no results" in lower


# ---------------------------------------------------------------------------
# Radon
# ---------------------------------------------------------------------------

_RADON_LEVEL_MAP: dict[str, Literal["lav", "moderat", "høy", "usikker"]] = {
    "1": "lav",
    "2": "moderat",
    "3": "høy",
    "0": "usikker",
}


def _guess_level_from_text(text: str) -> Literal["lav", "moderat", "høy", "usikker"]:
    lower = text.lower()
    if "høy" in lower or "hoy" in lower:
        return "høy"
    if "moderat" in lower or "middels" in lower:
        return "moderat"
    if "lav" in lower:
        return "lav"
    return "usikker"


def parse_radon(raw: str | None) -> RadonResult | None:
    if not raw or not raw.strip():
        return None
    if _is_service_exception(raw):
        return None
    if _is_no_results(raw):
        return None

    is_gml = "<msGMLOutput" in raw or "<?xml" in raw
    besk_m = re.search(r"<aktsomhetgrad_besk>([^<]+)</aktsomhetgrad_besk>", raw)
    grad_m = re.search(r"<aktsomhetgrad>([^<]+)</aktsomhetgrad>", raw)

    if besk_m or grad_m:
        besk = besk_m.group(1).strip() if besk_m else ""
        grad = grad_m.group(1).strip() if grad_m else ""
        level = _RADON_LEVEL_MAP.get(grad, _guess_level_from_text(besk))
        return RadonResult(level=level, detail=besk or f"Aktsomhetsgrad {grad}")

    if is_gml:
        return None

    if re.search(r"Feature\s+\d+", raw, re.IGNORECASE):
        return RadonResult(
            level="usikker",
            detail="Radon påvist i området — aktsomhetsgrad ikke tilgjengelig i tekstformat",
        )

    lower = raw.lower()
    level: Literal["lav", "moderat", "høy", "usikker"]
    if "høy" in lower or "hoy" in lower or "high" in lower:
        level = "høy"
    elif "moderat" in lower or "middels" in lower or "moderate" in lower:
        level = "moderat"
    elif "lav" in lower or "low" in lower:
        level = "lav"
    else:
        level = "usikker"

    lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
    detail = "; ".join(lines)
    for line in lines:
        m = re.search(r"aktsomhet(?:s)?grad\s*[=:]\s*'?(.+?)'?\s*$", line, re.IGNORECASE)
        if m:
            detail = m.group(1).strip()
            break

    return RadonResult(level=level, detail=detail)


# ---------------------------------------------------------------------------
# Løsmasser
# ---------------------------------------------------------------------------


def parse_losmasse(raw: str | None) -> LosmasseData | None:
    if not raw or not raw.strip():
        return None
    if _is_service_exception(raw):
        return None
    type_m = re.search(r"<losmassetype_tekst>([^<]+)</losmassetype_tekst>", raw)
    if not type_m:
        return None
    def_m = re.search(
        r"<losmassetype_definisjon>([^<]+)</losmassetype_definisjon>", raw
    )
    scale_m = re.search(
        r"<egnetmaalestokk_formattert>([^<]+)</egnetmaalestokk_formattert>", raw
    )
    return LosmasseData(
        type=type_m.group(1).strip(),
        definition=def_m.group(1).strip() if def_m else None,
        scale=scale_m.group(1).strip() if scale_m else None,
    )


# ---------------------------------------------------------------------------
# Berggrunn
# ---------------------------------------------------------------------------


def parse_berggrunn(raw: str | None) -> BerggrunData | None:
    if not raw or not raw.strip():
        return None
    if _is_service_exception(raw):
        return None
    rock_m = re.search(r"<hovedbergart_tekst>([^<]+)</hovedbergart_tekst>", raw)
    if not rock_m:
        return None
    unit_m = re.search(r"<bergartsenhet_tekst>([^<]+)</bergartsenhet_tekst>", raw)
    tectonic_m = re.search(
        r"<tektoniskhovedinndeling_tekst>([^<]+)</tektoniskhovedinndeling_tekst>", raw
    )
    metamorph_m = re.search(
        r"<metamorffacies_tekst>([^<]+)</metamorffacies_tekst>", raw
    )
    age_m = re.search(
        r"<dannelsesalder_visning_tekst>([^<]+)</dannelsesalder_visning_tekst>", raw
    )
    return BerggrunData(
        rockType=rock_m.group(1).strip(),
        unit=unit_m.group(1).strip() if unit_m else None,
        tectonicClassification=tectonic_m.group(1).strip() if tectonic_m else None,
        metamorphicFacies=metamorph_m.group(1).strip() if metamorph_m else None,
        formationAge=age_m.group(1).strip() if age_m else None,
    )


# ---------------------------------------------------------------------------
# Kulturminner
# ---------------------------------------------------------------------------


def parse_kulturminner(attrs_list: list[dict]) -> KulturminneData | None:
    if not attrs_list:
        return None
    items = [
        KulturminneItem(
            name=a.get("navn") or "Ukjent",
            protectionType=a.get("vernetype"),
            category=a.get("kulturminneKategori"),
            siteType=a.get("kulturminneLokalitetArt"),
            originalFunction=a.get("kulturminneOpprinngeligFunksjon"),
            protectionLaw=a.get("vernelov"),
            link=a.get("linkKulturminnesok"),
        )
        for a in attrs_list
    ]
    has_protected = any(
        "fredet" in (item.protectionType or "").lower()
        or "vedtaks" in (item.protectionType or "").lower()
        for item in items
    )
    return KulturminneData(count=len(items), items=items, hasProtected=has_protected)


# ---------------------------------------------------------------------------
# Støy veg
# ---------------------------------------------------------------------------

_STOY_CATEGORY_MAP: dict[str, str] = {
    "Lden5054": "50–54 dB",
    "Lden5559": "55–59 dB",
    "Lden6064": "60–64 dB",
    "Lden6569": "65–69 dB",
    "Lden7074": "70–74 dB",
    "LdenGreaterThan75": "≥75 dB",
    "Lnight5054": "50–54 dB (natt)",
    "Lnight5559": "55–59 dB (natt)",
    "Lnight6064": "60–64 dB (natt)",
    "Lnight6569": "65–69 dB (natt)",
    "LnightGreaterThan70": "≥70 dB (natt)",
}


def _extract_data_year(begin: str | None, end: str | None) -> int | None:
    date_str = end or begin
    if not date_str:
        return None
    m = re.search(r"(\d{4})", date_str)
    return int(m.group(1)) if m else None


def parse_stoy_veg(attrs_list: list[dict]) -> list[StoyVegItem] | None:
    if not attrs_list:
        return None
    return [
        StoyVegItem(
            decibelRange=_STOY_CATEGORY_MAP.get(a.get("category") or "", a.get("category") or ""),
            categoryCode=a.get("category") or "unknown",
            source=a.get("source"),
        )
        for a in attrs_list
    ]


def extract_stoy_veg_data_year(attrs_list: list[dict]) -> int | None:
    if not attrs_list:
        return None
    a = attrs_list[0]
    return _extract_data_year(
        a.get("measuretime_beginposition"), a.get("measuretime_endposition")
    )


# ---------------------------------------------------------------------------
# Støy jernbane
# ---------------------------------------------------------------------------


def parse_stoy_jernbane(raw: str | None) -> StoyJernbaneItem | None:
    if not raw or not raw.strip():
        return None
    if _is_service_exception(raw):
        return None
    if _is_no_results(raw):
        return None
    is_gml = "<msGMLOutput" in raw or "<?xml" in raw
    stoy_m = (
        re.search(r"<stoy_feature[^>]*>", raw, re.IGNORECASE)
        or re.search(r"<gml:featureMember>", raw, re.IGNORECASE)
        or re.search(r"<stoy[^_][^>]*>", raw, re.IGNORECASE)
    )
    decibel_m = re.search(r"<(?:desibel|db|stoy[^>]*value)>([^<]+)</", raw, re.IGNORECASE)
    type_m = re.search(r"<(?:stoytype|type|kategori)>([^<]+)</", raw, re.IGNORECASE)
    if stoy_m or decibel_m or type_m:
        parts: list[str] = []
        if decibel_m:
            parts.append(f"{decibel_m.group(1).strip()} dB")
        if type_m:
            parts.append(type_m.group(1).strip())
        detail = (
            f"Jernbanestøysone ({', '.join(parts)})" if parts
            else "Eiendommen ligger i jernbanestøysone"
        )
        return StoyJernbaneItem(inZone=True, detail=detail)
    if is_gml:
        return None
    if re.search(r"Feature\s+\d+", raw, re.IGNORECASE):
        return StoyJernbaneItem(inZone=True, detail="Eiendommen ligger i jernbanestøysone")
    return None


# ---------------------------------------------------------------------------
# Støy militær
# ---------------------------------------------------------------------------

_MILITAR_ZONE_MAP = {"R": "Rød sone", "G": "Gul sone", "r": "Rød sone", "g": "Gul sone"}


def parse_stoy_militar(raw: str | None) -> StoyMilitarItem | None:
    if not raw or not raw.strip():
        return None
    if _is_service_exception(raw):
        return None
    if _is_no_results(raw):
        return None
    kv: dict[str, str] = {}
    for line in raw.split("\n"):
        m = re.match(r"^\s*(\S+)\s*=\s*'?(.+?)'?\s*$", line)
        if m:
            kv[m.group(1).strip().lower()] = m.group(2).strip()
    zone_cat = kv.get("stoysonekategori")
    if not zone_cat:
        if not re.search(r"Feature\s+\d+", raw, re.IGNORECASE):
            return None
        return StoyMilitarItem(
            zoneCategory="?",
            zoneCategoryLabel="Støysone (ukjent kategori)",
        )
    year_str = kv.get("beregnetar")
    calc_year: int | None = None
    if year_str:
        with contextlib.suppress(ValueError):
            calc_year = int(year_str)
    return StoyMilitarItem(
        zoneCategory=zone_cat,
        zoneCategoryLabel=_MILITAR_ZONE_MAP.get(zone_cat, f"Sone {zone_cat}"),
        sourceName=kv.get("stoykildenavn"),
        info=kv.get("informasjon"),
        calculationYear=calc_year,
    )


# ---------------------------------------------------------------------------
# Støy combined
# ---------------------------------------------------------------------------


def _is_stale(year: int | None) -> bool:
    if year is None:
        return False
    return datetime.now(tz=UTC).year - year > 3


def parse_stoy_data(
    *,
    veg_attrs: list[dict] | None,
    jernbane_raw: str | None,
    militar_raw: str | None,
) -> StoyData | None:
    veg = _safe(lambda: parse_stoy_veg(veg_attrs)) if veg_attrs is not None else None
    jernbane = _safe(lambda: parse_stoy_jernbane(jernbane_raw)) if jernbane_raw else None
    militar = _safe(lambda: parse_stoy_militar(militar_raw)) if militar_raw else None

    if not veg and not jernbane and not militar:
        return None

    freshness: list[DataFreshness] = []
    if veg:
        data_year = extract_stoy_veg_data_year(veg_attrs or [])
        freshness.append(
            DataFreshness(
                dataYear=data_year,
                sourceLabel="Miljødirektoratet (vegstøy)",
                isStale=_is_stale(data_year),
            )
        )
    if jernbane:
        freshness.append(
            DataFreshness(dataYear=None, sourceLabel="Bane NOR (jernbanestøy)", isStale=False)
        )
    if militar:
        calc_year = militar.calculationYear
        freshness.append(
            DataFreshness(
                dataYear=calc_year,
                sourceLabel="Forsvaret (skytebane/militær)",
                isStale=_is_stale(calc_year),
            )
        )

    return StoyData(veg=veg, jernbane=jernbane, militar=militar, freshness=freshness)


# ---------------------------------------------------------------------------
# Naturvern
# ---------------------------------------------------------------------------

_STRICT_VERNEFORM = [
    "nasjonalpark",
    "naturreservat",
    "naturminne",
    "biotopvern",
    "dyrefredningsområde",
]


def _format_epoch_date(epoch_ms: int | None) -> str | None:
    if epoch_ms is None:
        return None
    try:
        dt = datetime.fromtimestamp(epoch_ms / 1000, tz=UTC)
        return dt.strftime("%d.%m.%Y")
    except (ValueError, OSError):
        return None


def parse_naturvern(attrs_list: list[dict]) -> NaturvernData | None:
    if not attrs_list:
        return None
    items = [
        NaturvernItem(
            name=a.get("offisieltNavn") or a.get("navn") or "Ukjent",
            verneform=a.get("verneform"),
            verneplan=a.get("verneplan"),
            vernedato=_format_epoch_date(a.get("vernedato")),
            majorEcosystemType=a.get("majorEcosystemType"),
            iucn=a.get("iucn"),
            faktaark=a.get("faktaark"),
        )
        for a in attrs_list
    ]
    has_strict = any(
        any(s in (item.verneform or "").lower() for s in _STRICT_VERNEFORM)
        for item in items
    )
    return NaturvernData(count=len(items), items=items, hasStrictProtection=has_strict)


# ---------------------------------------------------------------------------
# Grunnforurensning
# ---------------------------------------------------------------------------


def parse_grunnforurensning(attrs_list: list[dict]) -> GrunnforurensningData | None:
    if not attrs_list:
        return None
    items = [
        GrunnforurensningItem(
            name=a.get("Lokalitetnavn") or "Ukjent",
            siteType=a.get("Lokalitettype"),
            authority=a.get("Myndighet"),
            processStatus=a.get("Prosesstatus"),
            impactGrade=a.get("Pavirkningsgrad"),
            healthClass=a.get("HelsebasertTilstandsklasse"),
            faktaark=a.get("Faktaark"),
        )
        for a in attrs_list
    ]
    has_high_risk = any(
        "klasse 1" in (item.healthClass or "").lower()
        or "klasse 2" in (item.healthClass or "").lower()
        for item in items
    )
    return GrunnforurensningData(
        count=len(items), items=items, hasHighRisk=has_high_risk
    )


# ---------------------------------------------------------------------------
# Safe-parse helper
# ---------------------------------------------------------------------------


def _safe[T](fn) -> T | None:
    try:
        return fn()
    except Exception:
        return None
