"""
Address service — thin wrapper over Geonorge client.
"""

from app.clients.geonorge import search_addresses, search_addresses_by_point


async def addresses_search(
    *,
    sok: str | None = None,
    fuzzy: bool | None = None,
    sokemodus: str | None = None,
    adressenavn: str | None = None,
    kommunenummer: str | None = None,
    kommunenavn: str | None = None,
    gardsnummer: int | None = None,
    bruksnummer: int | None = None,
    postnummer: str | None = None,
    poststed: str | None = None,
    utkoordsys: int | None = None,
    treff_per_side: int | None = None,
    side: int | None = None,
) -> dict:
    return await search_addresses(
        sok=sok,
        fuzzy=fuzzy,
        sokemodus=sokemodus,
        adressenavn=adressenavn,
        kommunenummer=kommunenummer,
        kommunenavn=kommunenavn,
        gardsnummer=gardsnummer,
        bruksnummer=bruksnummer,
        postnummer=postnummer,
        poststed=poststed,
        utkoordsys=utkoordsys,
        treff_per_side=treff_per_side,
        side=side,
    )


async def addresses_reverse(
    *,
    lat: float,
    lon: float,
    radius: float,
    koordsys: int | None = None,
    utkoordsys: int | None = None,
    treff_per_side: int | None = None,
    side: int | None = None,
) -> dict:
    return await search_addresses_by_point(
        lat=lat,
        lon=lon,
        radius=radius,
        koordsys=koordsys,
        utkoordsys=utkoordsys,
        treff_per_side=treff_per_side,
        side=side,
    )
