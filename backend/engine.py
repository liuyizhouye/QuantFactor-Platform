"""Backtest and analytics routines."""

from __future__ import annotations

from datetime import datetime
from typing import Dict

import pandas as pd

from .data_provider import DataProvider
from .models import BacktestRequest, BacktestResult, Factor


class BacktestEngine:
    """Runs lightweight backtests over synthetic market data.

    The implementation is intentionally simple but structured so that more
    realistic logic (database persistence, live pricing APIs, etc.) can be added
    without refactoring callers.
    """

    def __init__(self, data_provider: DataProvider) -> None:
        self.data_provider = data_provider

    def run_backtest(self, request: BacktestRequest) -> BacktestResult:
        if request.end_date < request.start_date:
            raise ValueError("end_date must be on or after start_date")

        factor = self._require_factor(request.factor_id)
        prices = self.data_provider.get_market_snapshot(request.start_date, request.end_date)
        if len(prices) < 2:
            raise ValueError("Not enough price history for the requested window")
        daily_returns = prices["close"].pct_change().fillna(0)

        # A placeholder strategy: scale daily returns by a simple signal derived
        # from the factor formula length. In practice, replace with real factor
        # signals fetched from a database or API.
        signal_strength = max(len(factor.formula), 1) ** 0.5
        strategy_returns = daily_returns * (signal_strength / 100)
        equity_curve = (1 + strategy_returns).cumprod() * request.capital

        metrics: Dict[str, float] = {
            "total_return": float(equity_curve.iloc[-1] / request.capital - 1),
            "volatility": float(strategy_returns.std() * (252 ** 0.5)),
            "sharpe": float(strategy_returns.mean() / (strategy_returns.std() + 1e-8) * (252 ** 0.5)),
        }

        return BacktestResult(
            factor_id=request.factor_id,
            start_date=request.start_date,
            end_date=request.end_date,
            metrics=metrics,
            equity_curve=[float(v) for v in equity_curve.values],
        )

    # ------------------------------ Internals --------------------------------
    def _require_factor(self, factor_id: str) -> Factor:
        factor = self.data_provider.get_factor(factor_id)
        if not factor:
            raise ValueError(f"Factor {factor_id} not found")
        return factor
