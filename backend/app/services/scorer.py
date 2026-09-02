"""Scoring engine.

Combines two signals into a final 0-100 fit score:

    final = SIMILARITY_WEIGHT * (cosine_similarity * 100) + LLM_WEIGHT * llm_score

- cosine_similarity: embedding match between the JD and the resume text.
- llm_score: an LLM's holistic 0-100 judgement, with a short reasoning string.

Results are memoized in the cache keyed by (job_id, candidate_id) so repeated
reads don't recompute (and don't re-hit the LLM).
"""
from __future__ import annotations

import logging
from dataclasses import asdict, dataclass
from typing import Optional

from app.core.config import settings
from app.services.cache import Cache, get_cache
from app.services.embeddings import text_similarity
from app.services.extractor import _extract_json_object
from app.services.llm import LLMProvider, get_llm_provider
from app.services.llm.prompts import SCORING_SYSTEM, build_scoring_prompt

logger = logging.getLogger("resume_screener.scorer")


@dataclass
class ScoreResult:
    similarity_score: float  # 0..1
    llm_score: float         # 0..100
    llm_reasoning: str
    final_score: float       # 0..100


def _clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def score_candidate(
    *,
    job_id: str,
    job_title: str,
    job_description: str,
    candidate_id: str,
    resume_text: str,
    candidate_skills: list[str],
    provider: Optional[LLMProvider] = None,
    cache: Optional[Cache] = None,
    use_cache: bool = True,
) -> ScoreResult:
    provider = provider or get_llm_provider()
    cache = cache or get_cache()
    cache_key = f"score:{job_id}:{candidate_id}"

    if use_cache:
        cached = cache.get(cache_key)
        if cached:
            return ScoreResult(**cached)

    # 1) Embedding similarity between JD and resume text.
    similarity = text_similarity(job_description, resume_text or " ".join(candidate_skills))

    # 2) LLM holistic judgement.
    llm_score = 0.0
    reasoning = ""
    try:
        raw = provider.complete(
            system=SCORING_SYSTEM,
            user=build_scoring_prompt(job_title, job_description, candidate_skills),
            max_tokens=400,
        )
        data = _extract_json_object(raw)
        llm_score = _clamp(float(data.get("score", 0)), 0.0, 100.0)
        reasoning = str(data.get("reasoning", "")).strip()
    except Exception as exc:
        logger.warning("LLM scoring failed for candidate %s (%s). Attempting fallback scorer.", candidate_id, exc)
        try:
            from app.services.llm.mock_provider import MockLLMProvider

            mock_provider = MockLLMProvider()
            raw = mock_provider.complete(
                system=SCORING_SYSTEM,
                user=build_scoring_prompt(job_title, job_description, candidate_skills),
                max_tokens=400,
            )
            data = _extract_json_object(raw)
            llm_score = _clamp(float(data.get("score", 0)), 0.0, 100.0)
            reasoning = str(data.get("reasoning", "")).strip()
        except Exception:
            reasoning = "LLM scoring unavailable; final score reflects similarity only."

    final = settings.SIMILARITY_WEIGHT * (similarity * 100.0) + settings.LLM_WEIGHT * llm_score
    result = ScoreResult(
        similarity_score=round(similarity, 4),
        llm_score=round(llm_score, 2),
        llm_reasoning=reasoning,
        final_score=round(_clamp(final, 0.0, 100.0), 2),
    )

    if use_cache:
        cache.set(cache_key, asdict(result))
    return result
