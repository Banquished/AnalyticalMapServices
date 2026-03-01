"""
Property service — thin wrapper over Kartverket client.
"""

from app.clients.kartverket import (
    get_geokoding,
    get_properties_by_point,
    get_property_areas_by_point,
)


async def geokoding(
    *,
    matrikkelnummer: str | None = None,
    kommunenummer: str | None = None,
    gardsnummer: int | None = None,
    bruksnummer: int | None = None,
    festenummer: int | None = None,
    seksjonsnummer: int | None = None,
    omrade: bool | None = None,
    utkoordsys: int | None = None,
) -> dict:
    return await get_geokoding(
        matrikkelnummer=matrikkelnummer,
        kommunenummer=kommunenummer,
        gardsnummer=gardsnummer,
        bruksnummer=bruksnummer,
        festenummer=festenummer,
        seksjonsnummer=seksjonsnummer,
        omrade=omrade,
        utkoordsys=utkoordsys,
    )


async def properties_by_point(
    *,
    ost: float,
    nord: float,
    koordsys: int = 4258,
    radius: int | None = None,
    treff_per_side: int | None = None,
    side: int | None = None,
    utkoordsys: int | None = None,
) -> dict:
    return await get_properties_by_point(
        ost=ost,
        nord=nord,
        koordsys=koordsys,
        radius=radius,
        treff_per_side=treff_per_side,
        side=side,
        utkoordsys=utkoordsys,
    )


async def property_areas_by_point(
    *,
    ost: float,
    nord: float,
    koordsys: int = 4258,
    radius: int | None = None,
    maks_treff: int | None = None,
    utkoordsys: int | None = None,
) -> dict:
    return await get_property_areas_by_point(
        ost=ost,
        nord=nord,
        koordsys=koordsys,
        radius=radius,
        maks_treff=maks_treff,
        utkoordsys=utkoordsys,
    )
