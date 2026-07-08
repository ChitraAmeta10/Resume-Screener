"""Provider-agnostic LLM interface.

Providers expose a single ``complete(system, user)`` primitive that returns raw
text. All *structured* behaviour (JSON parsing, Pydantic validation, retries)
lives in the callers (``extractor``/``scorer``), keeping providers thin and easy
to swap.
"""
from __future__ import annotations

from abc import ABC, abstractmethod


class LLMProvider(ABC):
    name: str = "base"

    @abstractmethod
    def complete(self, system: str, user: str, max_tokens: int = 1024) -> str:
        """Return the model's text completion for the given system+user prompt."""
        raise NotImplementedError
