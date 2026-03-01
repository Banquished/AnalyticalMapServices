"""
Static config (label maps and skip-key sets) for generelt parsers.
Extracted to keep generelt.py focused on parsing logic.
"""

# ---------------------------------------------------------------------------
# Kommuneplan / Kommunedelplan (DIBK NAP WMS)
# ---------------------------------------------------------------------------

KP_LABEL_MAP: dict[str, str] = {
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

KP_SKIP_KEYS: set[str] = {
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

# ---------------------------------------------------------------------------
# Planlegging igangsatt (DiBK plandata)
# ---------------------------------------------------------------------------

PI_LABEL_MAP: dict[str, str] = {
    "plannavn": "Plannavn",
    "planidentifikasjon": "Plan-ID",
    "arealplanid.planidentifikasjon": "Plan-ID",
    "arealplan": "Arealplan-ID",
    "nasjonalarealplanid.planid": "Nasjonal plan-ID",
    "plantype": "Plantype",
    "planstatus": "Planstatus",
    "igangsettingsdato": "Igangsettingsdato",
    "kunngjøringsdatovarselomplanoppstart": "Kunngjøring planoppstart",
    "forslagsstiller": "Forslagsstiller",
    "forslagsstillertype": "Forslagsstillertype",
    "kommunenavn": "Kommune",
    "kommunenummer": "Kommunenummer",
    "lovreferanse": "Lovreferanse",
    "linkarealplan": "Lenke: Arealplan",
    "linkplandokumenter": "Lenke: Plandokumenter",
}

PI_SKIP_KEYS: set[str] = {
    "getfeatureinfo results:",
    "globalid",
    "identifikasjon",
    "identifikasjon.lokalid",
    "identifikasjon.versjonid",
    "identifikasjon.navnerom",
    "oppdateringsdato",
    "datafangstdato",
    "navnerom",
    "versjonid",
    "objid",
    "objekttypenavn",
    "geometri",
    "område",
    "arealplanid.kommunenummer",
    "arealplanid.landkode",
    "nasjonalarealplanid.kommunenummer",
    "nasjonalarealplanid.landkode",
    "forstedigitaliseringsdato",
}

# ---------------------------------------------------------------------------
# Matrikkelkart / Teiger (Geonorge)
# ---------------------------------------------------------------------------

MATRIKKEL_SKIP_KEYS: set[str] = {
    "getfeatureinfo results:",
    "representasjonspunkt",
    "uuidteig",
    "globalid",
    "navnerom",
    "versjonid",
    "malemetode",
    "noyaktighet",
}

MATRIKKEL_LABEL_MAP: dict[str, str] = {
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
