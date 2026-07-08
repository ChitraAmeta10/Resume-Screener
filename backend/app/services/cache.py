"""Small cache abstraction: Redis when configured, in-process dict otherwise.

Stores JSON-serializable dicts. Used to memoize expensive JD-vs-resume scoring
so repeated dashboard loads don't re-hit the LLM.
"""
from __future__ import annotations

import json
import time
from functools import lru_cache
from typing import Any, Optional

from app.core.config import settings


class Cache:
    def get(self, key: str) -> Optional[dict]:  # pragma: no cover - interface
        raise NotImplementedError

    def set(self, key: str, value: dict, ttl: Optional[int] = None) -> None:  # pragma: no cover
        raise NotImplementedError

    def delete(self, key: str) -> None:  # pragma: no cover
        raise NotImplementedError


class InMemoryCache(Cache):
    def __init__(self) -> None:
        self._store: dict[str, tuple[float, dict]] = {}

    def get(self, key: str) -> Optional[dict]:
        item = self._store.get(key)
        if not item:
            return None
        expires_at, value = item
        if expires_at and expires_at < time.time():
            self._store.pop(key, None)
            return None
        return value

    def set(self, key: str, value: dict, ttl: Optional[int] = None) -> None:
        ttl = settings.CACHE_TTL_SECONDS if ttl is None else ttl
        expires_at = time.time() + ttl if ttl else 0.0
        self._store[key] = (expires_at, value)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)


class RedisCache(Cache):
    def __init__(self, url: str) -> None:
        import redis  # lazy

        self._client = redis.Redis.from_url(url, decode_responses=True)

    def get(self, key: str) -> Optional[dict]:
        raw = self._client.get(key)
        return json.loads(raw) if raw else None

    def set(self, key: str, value: dict, ttl: Optional[int] = None) -> None:
        ttl = settings.CACHE_TTL_SECONDS if ttl is None else ttl
        self._client.set(key, json.dumps(value), ex=ttl or None)

    def delete(self, key: str) -> None:
        self._client.delete(key)


@lru_cache
def get_cache() -> Cache:
    if settings.REDIS_URL:
        try:
            return RedisCache(settings.REDIS_URL)
        except Exception:  # fall back gracefully if redis unavailable
            return InMemoryCache()
    return InMemoryCache()
