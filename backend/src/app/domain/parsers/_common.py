"""
Shared helpers for WMS response parsers.
"""


def is_service_exception(raw: str) -> bool:
    """Return True if raw is a WMS ServiceException or shapefile-open error."""
    return "ServiceException" in raw or "msShapefileOpen" in raw


def is_no_results(raw: str) -> bool:
    """Return True if raw indicates no matching features."""
    lower = raw.lower()
    return "no features" in lower or "search returned no results" in lower
