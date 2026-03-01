"""
Shared utilities for API clients.
"""

from typing import Any


def build_url(base: str, path: str, params: dict[str, Any]) -> tuple[str, dict[str, str]]:
    """Return (url, cleaned_params) with None/empty values removed and all values stringified."""
    def _fmt(v: Any) -> str:
        if isinstance(v, bool):
            return str(v).lower()           # True → "true"
        if isinstance(v, float) and v.is_integer():
            return str(int(v))              # 200.0 → "200"
        return str(v)

    cleaned = {k: _fmt(v) for k, v in params.items() if v is not None and v != ""}
    return f"{base}{path}", cleaned
