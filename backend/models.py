"""Core data models for the QuantFactor backend.

These Pydantic models are shared between the API, engine, and data provider
layers. Database- and third-party-service specific concerns should live
outside of these definitions.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class FactorPerformance(BaseModel):
    """Simple performance snapshot for a factor."""

    sharpe: float
    ic: float = Field(description="Information coefficient")
    annualized_return: float
    max_drawdown: float

    @field_validator("max_drawdown")
    @classmethod
    def drawdown_should_be_negative(cls, value: float) -> float:
        if value > 0:
            raise ValueError("max_drawdown should be negative or zero")
        return value


class Factor(BaseModel):
    """Represents a quant factor definition."""

    id: str
    name: str
    description: str
    formula: str
    category: str
    frequency: str
    created_at: datetime
    performance: Optional[FactorPerformance] = None


class PortfolioAllocation(BaseModel):
    """Position sizing for a single asset inside a portfolio."""

    symbol: str
    weight: float


class Portfolio(BaseModel):
    """A collection of factor-driven allocations."""

    id: str
    name: str
    description: Optional[str] = None
    allocations: List[PortfolioAllocation]
    created_at: datetime

    @field_validator("allocations")
    @classmethod
    def weights_should_sum_to_one(cls, allocations: List[PortfolioAllocation]) -> List[PortfolioAllocation]:
        total_weight = sum(a.weight for a in allocations)
        if not 0.99 <= total_weight <= 1.01:
            raise ValueError("Portfolio weights should sum to ~1.0")
        return allocations


class BacktestResult(BaseModel):
    """Output of a backtest request."""

    factor_id: str
    start_date: datetime
    end_date: datetime
    metrics: Dict[str, float]
    equity_curve: List[float]


class BacktestRequest(BaseModel):
    """Payload for running a backtest."""

    factor_id: str
    start_date: datetime
    end_date: datetime
    capital: float = Field(gt=0)


class InsightResponse(BaseModel):
    """AI-generated insights attached to a factor or portfolio."""

    subject_id: str
    summary: str
    rationale: Optional[str] = None
    caveats: Optional[str] = None
