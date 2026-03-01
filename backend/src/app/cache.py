from cachetools import TTLCache

from app.config import settings

# In-process only. Each worker has its own cache.
# For multi-worker deployments (gunicorn -w N), consider Redis.
_cache: TTLCache = TTLCache(
    maxsize=settings.cache_max_size,
    ttl=settings.cache_ttl_seconds,
)


def get_cache() -> TTLCache:
    return _cache


def coord_cache_key(lat: float, lng: float) -> str:
    """Round coordinates to 3 decimal places (~111m grid) to maximise cache hits."""
    return f"{lat:.3f},{lng:.3f}"
