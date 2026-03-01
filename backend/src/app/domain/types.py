"""
Pydantic v2 models mirroring the TypeScript types in featureInfoTypes.ts.

All field names use camelCase to match the TS types and produce JSON
that the frontend can deserialise without transformation.
"""

from typing import Literal

from pydantic import BaseModel, ConfigDict

# ---------------------------------------------------------------------------
# Base config — allow camelCase field population
# ---------------------------------------------------------------------------


class _Base(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


# ---------------------------------------------------------------------------
# Klima tab
# ---------------------------------------------------------------------------


class FloodZoneResult(_Base):
    inZone: bool
    detail: str


class KlimaData(_Base):
    flom50: FloodZoneResult | None = None
    flom100: FloodZoneResult | None = None
    flom200: FloodZoneResult | None = None
    skred100: FloodZoneResult | None = None


# ---------------------------------------------------------------------------
# Risiko tab
# ---------------------------------------------------------------------------

RadonLevel = Literal["lav", "moderat", "høy", "usikker"] | None


class RadonResult(_Base):
    level: RadonLevel
    detail: str


class LosmasseData(_Base):
    type: str
    definition: str | None = None
    scale: str | None = None


class BerggrunData(_Base):
    rockType: str
    unit: str | None = None
    tectonicClassification: str | None = None
    metamorphicFacies: str | None = None
    formationAge: str | None = None


class KulturminneItem(_Base):
    name: str
    protectionType: str | None = None
    category: str | None = None
    siteType: str | None = None
    originalFunction: str | None = None
    protectionLaw: str | None = None
    link: str | None = None


class KulturminneData(_Base):
    count: int
    items: list[KulturminneItem]
    hasProtected: bool


class StoyVegItem(_Base):
    decibelRange: str
    categoryCode: str
    source: str | None = None


class StoyJernbaneItem(_Base):
    inZone: bool
    detail: str


class StoyMilitarItem(_Base):
    zoneCategory: str
    zoneCategoryLabel: str
    sourceName: str | None = None
    info: str | None = None
    calculationYear: int | None = None


class DataFreshness(_Base):
    dataYear: int | None = None
    sourceLabel: str
    isStale: bool


class StoyData(_Base):
    veg: list[StoyVegItem] | None = None
    jernbane: StoyJernbaneItem | None = None
    militar: StoyMilitarItem | None = None
    freshness: list[DataFreshness] = []


class NaturvernItem(_Base):
    name: str
    verneform: str | None = None
    verneplan: str | None = None
    vernedato: str | None = None
    majorEcosystemType: str | None = None
    iucn: str | None = None
    faktaark: str | None = None


class NaturvernData(_Base):
    count: int
    items: list[NaturvernItem]
    hasStrictProtection: bool


class GrunnforurensningItem(_Base):
    name: str
    siteType: str | None = None
    authority: str | None = None
    processStatus: str | None = None
    impactGrade: str | None = None
    healthClass: str | None = None
    faktaark: str | None = None


class GrunnforurensningData(_Base):
    count: int
    items: list[GrunnforurensningItem]
    hasHighRisk: bool


class KvikkleireResult(_Base):
    inZone: bool
    detail: str


class RisikoData(_Base):
    radon: RadonResult | None = None
    kvikkleire: KvikkleireResult | None = None
    losmasser: LosmasseData | None = None
    berggrunn: BerggrunData | None = None
    kulturminner: KulturminneData | None = None
    stoy: StoyData | None = None
    naturvern: NaturvernData | None = None
    grunnforurensning: GrunnforurensningData | None = None


# ---------------------------------------------------------------------------
# Generelt tab
# ---------------------------------------------------------------------------


class KommuneplanData(_Base):
    formaal: str | None = None
    utnyttingsgrad: str | None = None
    details: dict[str, str] = {}


class PlanleggingIgangsattData(_Base):
    plannavn: str | None = None
    plantype: str | None = None
    igangsettingsdato: str | None = None
    details: dict[str, str] = {}


class GenereltData(_Base):
    matrikkelInfo: str
    details: dict[str, str] = {}
    serviceError: str | None = None
    kommuneplan: KommuneplanData | None = None
    kommunedelplan: KommuneplanData | None = None
    planleggingIgangsatt: PlanleggingIgangsattData | None = None


# ---------------------------------------------------------------------------
# Top-level response
# ---------------------------------------------------------------------------


class FeatureInfoData(_Base):
    klima: KlimaData | None = None
    risiko: RisikoData | None = None
    generelt: GenereltData | None = None
    fetchedAt: int  # ms since epoch
