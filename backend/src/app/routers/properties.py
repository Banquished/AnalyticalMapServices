from fastapi import APIRouter, Query

from app.services.property import geokoding, properties_by_point, property_areas_by_point

router = APIRouter(tags=["properties"])


@router.get("/properties/search")
async def search_properties(
    ost: float | None = Query(None, description="Longitude / East (WGS84)"),
    nord: float | None = Query(None, description="Latitude / North (WGS84)"),
    koordsys: int = Query(4258, description="Input CRS SRID"),
    radius: int | None = Query(None, description="Search radius in metres"),
    treff_per_side: int | None = Query(None, alias="treffPerSide"),
    side: int | None = Query(None),
    utkoordsys: int | None = Query(None),
    # Matrikkel lookup params
    matrikkelnummer: str | None = Query(None),
    kommunenummer: str | None = Query(None),
    gardsnummer: int | None = Query(None),
    bruksnummer: int | None = Query(None),
    festenummer: int | None = Query(None),
    seksjonsnummer: int | None = Query(None),
) -> dict:
    """Find properties near a point (by lat/lng) or by matrikkel number."""
    if matrikkelnummer or kommunenummer or gardsnummer:
        return await geokoding(
            matrikkelnummer=matrikkelnummer,
            kommunenummer=kommunenummer,
            gardsnummer=gardsnummer,
            bruksnummer=bruksnummer,
            festenummer=festenummer,
            seksjonsnummer=seksjonsnummer,
            utkoordsys=utkoordsys,
        )
    return await properties_by_point(
        ost=ost or 0,
        nord=nord or 0,
        koordsys=koordsys,
        radius=radius,
        treff_per_side=treff_per_side,
        side=side,
        utkoordsys=utkoordsys,
    )


@router.get("/properties/areas")
async def get_property_areas(
    ost: float = Query(..., description="Longitude / East (WGS84)"),
    nord: float = Query(..., description="Latitude / North (WGS84)"),
    koordsys: int = Query(4258),
    radius: int | None = Query(None),
    maks_treff: int | None = Query(None, alias="maksTreff"),
    utkoordsys: int | None = Query(None),
) -> dict:
    """Fetch GeoJSON property area polygons near a point."""
    return await property_areas_by_point(
        ost=ost,
        nord=nord,
        koordsys=koordsys,
        radius=radius,
        maks_treff=maks_treff,
        utkoordsys=utkoordsys,
    )


@router.get("/properties/geokoding")
async def get_geokoding_endpoint(
    matrikkelnummer: str | None = Query(None),
    kommunenummer: str | None = Query(None),
    gardsnummer: int | None = Query(None),
    bruksnummer: int | None = Query(None),
    festenummer: int | None = Query(None),
    seksjonsnummer: int | None = Query(None),
    omrade: bool | None = Query(None),
    utkoordsys: int | None = Query(None),
) -> dict:
    """Kartverket /geokoding — find property by matrikkel, optionally with area polygon."""
    return await geokoding(
        matrikkelnummer=matrikkelnummer,
        kommunenummer=kommunenummer,
        gardsnummer=gardsnummer,
        bruksnummer=bruksnummer,
        festenummer=festenummer,
        seksjonsnummer=seksjonsnummer,
        omrade=omrade,
        utkoordsys=utkoordsys,
    )
