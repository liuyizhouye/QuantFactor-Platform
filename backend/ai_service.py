"""AI assistant utilities with pluggable model providers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .models import Factor, InsightResponse, Portfolio


@dataclass
class AIConfig:
    model: str = "gemini-pro"
    temperature: float = 0.3


class AIService:
    """Wraps AI calls and keeps defaults in one place.

    Replace the `_call_model` stub with an actual SDK call when wiring up Gemini
    or another provider.
    """

    def __init__(self, config: Optional[AIConfig] = None) -> None:
        self.config = config or AIConfig()

    def summarize_factor(self, factor: Factor) -> InsightResponse:
        prompt = (
            f"Summarize the trading idea behind {factor.name} "
            f"(category={factor.category}, frequency={factor.frequency})."
        )
        summary = self._call_model(prompt)
        return InsightResponse(subject_id=factor.id, summary=summary)

    def summarize_portfolio(self, portfolio: Portfolio) -> InsightResponse:
        description = portfolio.description or "A factor-based portfolio"
        symbols = ", ".join(a.symbol for a in portfolio.allocations)
        prompt = (
            f"Explain the rationale for portfolio {portfolio.name}: {description}. "
            f"Symbols: {symbols}"
        )
        summary = self._call_model(prompt)
        return InsightResponse(subject_id=portfolio.id, summary=summary)

    # ------------------------------ Internals --------------------------------
    def _call_model(self, prompt: str) -> str:
        # TODO: Integrate real Gemini/LLM client
        return (
            "(AI placeholder) "
            "This is where a call to your preferred model provider would go. "
            f"Prompt: {prompt}"
        )
