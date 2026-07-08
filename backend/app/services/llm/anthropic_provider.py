"""Anthropic Claude provider.

Uses the official ``anthropic`` SDK. Imported lazily so the package is only
required when this provider is actually selected.
"""
from __future__ import annotations

from app.core.config import settings
from app.services.llm.base import LLMProvider


class AnthropicProvider(LLMProvider):
    name = "anthropic"

    def __init__(self) -> None:
        if not settings.ANTHROPIC_API_KEY:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        import anthropic  # lazy

        self._client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        self._model = settings.ANTHROPIC_MODEL

    def complete(self, system: str, user: str, max_tokens: int = 1024) -> str:
        message = self._client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        # Concatenate any text blocks in the response.
        parts = [block.text for block in message.content if getattr(block, "type", None) == "text"]
        return "".join(parts).strip()
