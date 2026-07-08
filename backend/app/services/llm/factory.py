"""Select and cache the configured LLM provider."""
from __future__ import annotations

from functools import lru_cache

from app.core.config import settings
from app.services.llm.base import LLMProvider


@lru_cache
def get_llm_provider() -> LLMProvider:
    provider = settings.LLM_PROVIDER
    if provider == "mock":
        from app.services.llm.mock_provider import MockLLMProvider

        return MockLLMProvider()
    if provider == "anthropic":
        from app.services.llm.anthropic_provider import AnthropicProvider

        return AnthropicProvider()
    if provider == "openai":
        from app.services.llm.openai_provider import OpenAIProvider

        return OpenAIProvider()
    raise ValueError(f"Unknown LLM_PROVIDER: {provider}")
