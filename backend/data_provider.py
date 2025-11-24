"""Lightweight data-access layer with room for database/API integrations."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

import numpy as np
import pandas as pd

from .models import Factor, Portfolio


class DataProvider:
    """In-memory store that can be upgraded to real persistence later.

    All methods contain clear placeholders where database or remote API calls can
    be wired in without changing the higher-level engine or API code.
    """

    def __init__(self) -> None:
        self._factors: Dict[str, Factor] = {}
        self._portfolios: Dict[str, Portfolio] = {}

    # ----------------------------- Factor methods ----------------------------
    def list_factors(self) -> List[Factor]:
        return list(self._factors.values())

    def get_factor(self, factor_id: str) -> Optional[Factor]:
        return self._factors.get(factor_id)

    def save_factor(self, factor: Factor) -> Factor:
        # TODO: Persist to database
        self._factors[factor.id] = factor
        return factor

    def delete_factor(self, factor_id: str) -> bool:
        # TODO: Remove from database
        return self._factors.pop(factor_id, None) is not None

    # --------------------------- Portfolio methods ---------------------------
    def list_portfolios(self) -> List[Portfolio]:
        return list(self._portfolios.values())

    def save_portfolio(self, portfolio: Portfolio) -> Portfolio:
        # TODO: Persist to database
        self._portfolios[portfolio.id] = portfolio
        return portfolio

    def delete_portfolio(self, portfolio_id: str) -> bool:
        # TODO: Remove from database
        return self._portfolios.pop(portfolio_id, None) is not None

    # ----------------------------- Market methods ----------------------------
    def get_market_snapshot(self, days: int = 60) -> pd.DataFrame:
        """Return a synthetic price series.

        This placeholder makes it easy to swap in a real market-data provider by
        replacing this method with an API call.
        """

        today = datetime.utcnow().date()
        dates = pd.date_range(end=today, periods=days)
        # Generate a gently trending price path
        base_price = 100.0
        returns = np.random.normal(loc=0.0005, scale=0.01, size=days)
        prices = (1 + pd.Series(returns)).cumprod() * base_price
        return pd.DataFrame({"date": dates, "close": prices}).set_index("date")
