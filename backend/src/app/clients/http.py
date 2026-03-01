"""
Shared async httpx client with retry + timeout.

Lifecycle: the client is created at startup and closed at shutdown
via the FastAPI lifespan context manager (see main.py).
"""

import asyncio
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_client: httpx.AsyncClient | None = None

TRANSIENT_STATUSES = {429, 502, 503, 504}


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


async def fetch_text(
    url: str,
    params: dict[str, Any] | None = None,
    *,
    retries: int | None = None,
) -> str | None:
    """GET request returning text; returns None on error (logs warning)."""
    max_retries = retries if retries is not None else settings.request_retries
    client = get_client()
    last_exc: Exception | None = None

    for attempt in range(max_retries + 1):
        try:
            resp = await client.get(url, params=params)
            if resp.is_success:
                return resp.text
            if resp.status_code in TRANSIENT_STATUSES and attempt < max_retries:
                await asyncio.sleep(0.5 * 2**attempt)
                continue
            logger.warning("fetch_text %s → HTTP %s", url, resp.status_code)
            return None
        except httpx.TimeoutException as exc:
            last_exc = exc
            if attempt < max_retries:
                await asyncio.sleep(0.5 * 2**attempt)
            continue
        except httpx.RequestError as exc:
            last_exc = exc
            if attempt < max_retries:
                await asyncio.sleep(0.5 * 2**attempt)
            continue

    logger.warning("fetch_text %s failed after %d attempts: %s", url, max_retries + 1, last_exc)
    return None


async def fetch_json(
    url: str,
    params: dict[str, Any] | None = None,
    *,
    retries: int | None = None,
) -> dict | None:
    """GET request returning parsed JSON; returns None on error (logs warning)."""
    max_retries = retries if retries is not None else settings.request_retries
    client = get_client()
    last_exc: Exception | None = None

    for attempt in range(max_retries + 1):
        try:
            resp = await client.get(url, params=params)
            if resp.is_success:
                return resp.json()
            if resp.status_code in TRANSIENT_STATUSES and attempt < max_retries:
                await asyncio.sleep(0.5 * 2**attempt)
                continue
            logger.warning("fetch_json %s → HTTP %s", url, resp.status_code)
            return None
        except httpx.TimeoutException as exc:
            last_exc = exc
            if attempt < max_retries:
                await asyncio.sleep(0.5 * 2**attempt)
            continue
        except httpx.RequestError as exc:
            last_exc = exc
            if attempt < max_retries:
                await asyncio.sleep(0.5 * 2**attempt)
            continue

    logger.warning("fetch_json %s failed after %d attempts: %s", url, max_retries + 1, last_exc)
    return None


async def fetch_json_strict(url: str, params: dict[str, Any] | None = None) -> dict:
    """Like fetch_json but raises ApiError on failure (for callers that need to propagate)."""
    result = await fetch_json(url, params)
    if result is None:
        raise ApiError("network", f"Request failed: {url}")
    return result
