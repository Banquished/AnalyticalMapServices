"""
Shared async httpx client with retry + timeout.

Lifecycle: the client is created at startup and closed at shutdown
via the FastAPI lifespan context manager (see main.py).
"""

import asyncio
import logging
from typing import Any, Literal, overload

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_client: httpx.AsyncClient | None = None

TRANSIENT_STATUSES = {429, 502, 503, 504}
RETRY_BACKOFF_BASE: float = 0.5


class ApiError(Exception):
    kind: str

    def __init__(self, kind: str, message: str, status: int | None = None) -> None:
        super().__init__(message)
        self.kind = kind
        self.status = status


def get_client() -> httpx.AsyncClient:
    if _client is None:
        raise RuntimeError("HTTP client not initialised — call startup() first")
    return _client


async def startup() -> None:
    global _client
    _client = httpx.AsyncClient(
        timeout=httpx.Timeout(settings.request_timeout_seconds),
        follow_redirects=True,
        headers={"User-Agent": "AnalyticalMapServices/0.1 (backend)"},
    )


async def shutdown() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


@overload
async def _fetch_with_retry(
    url: str,
    params: dict[str, Any] | None,
    max_retries: int,
    *,
    parse_json: Literal[True],
) -> dict[str, Any] | None: ...


@overload
async def _fetch_with_retry(
    url: str,
    params: dict[str, Any] | None,
    max_retries: int,
    *,
    parse_json: Literal[False],
) -> str | None: ...


async def _fetch_with_retry(
    url: str,
    params: dict[str, Any] | None,
    max_retries: int,
    *,
    parse_json: bool,
) -> str | dict[str, Any] | None:
    """Shared retry loop for text and JSON fetches."""
    client = get_client()
    last_exc: Exception | None = None
    label = "fetch_json" if parse_json else "fetch_text"

    for attempt in range(max_retries + 1):
        try:
            resp = await client.get(url, params=params)
            if resp.is_success:
                return resp.json() if parse_json else resp.text
            if resp.status_code in TRANSIENT_STATUSES and attempt < max_retries:
                await asyncio.sleep(RETRY_BACKOFF_BASE * 2**attempt)
                continue
            logger.warning("%s %s → HTTP %s", label, url, resp.status_code)
            return None
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            last_exc = exc
            if attempt < max_retries:
                await asyncio.sleep(RETRY_BACKOFF_BASE * 2**attempt)

    logger.warning("%s %s failed after %d attempts: %s", label, url, max_retries + 1, last_exc)
    return None


async def fetch_text(
    url: str,
    params: dict[str, Any] | None = None,
    *,
    retries: int | None = None,
) -> str | None:
    """GET request returning text; returns None on error (logs warning)."""
    max_retries = retries if retries is not None else settings.request_retries
    return await _fetch_with_retry(url, params, max_retries, parse_json=False)


async def fetch_json(
    url: str,
    params: dict[str, Any] | None = None,
    *,
    retries: int | None = None,
) -> dict[str, Any] | None:
    """GET request returning parsed JSON; returns None on error (logs warning)."""
    max_retries = retries if retries is not None else settings.request_retries
    return await _fetch_with_retry(url, params, max_retries, parse_json=True)


async def fetch_json_strict(url: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    """Like fetch_json but raises ApiError on failure (for callers that need to propagate)."""
    result = await fetch_json(url, params)
    if result is None:
        raise ApiError("network", f"Request failed: {url}")
    return result
