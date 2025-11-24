"""FastAPI entrypoint exposing factor, portfolio, and backtest operations."""

from __future__ import annotations

from datetime import datetime
from typing import List

from fastapi import FastAPI, HTTPException

from .ai_service import AIService
from .data_provider import DataProvider
from .engine import BacktestEngine
from .models import BacktestRequest, BacktestResult, Factor, InsightResponse, Portfolio

app = FastAPI(title="QuantFactor Platform", version="0.1.0")

data_provider = DataProvider()
ai_service = AIService()
engine = BacktestEngine(data_provider)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/factors", response_model=List[Factor])
def list_factors() -> List[Factor]:
    return data_provider.list_factors()


@app.post("/factors", response_model=Factor)
def create_factor(factor: Factor) -> Factor:
    return data_provider.save_factor(factor)


@app.delete("/factors/{factor_id}")
def delete_factor(factor_id: str) -> dict:
    deleted = data_provider.delete_factor(factor_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Factor not found")
    return {"deleted": True}


@app.post("/factors/{factor_id}/insight", response_model=InsightResponse)
def factor_insight(factor_id: str) -> InsightResponse:
    factor = data_provider.get_factor(factor_id)
    if not factor:
        raise HTTPException(status_code=404, detail="Factor not found")
    return ai_service.summarize_factor(factor)


@app.get("/portfolios", response_model=List[Portfolio])
def list_portfolios() -> List[Portfolio]:
    return data_provider.list_portfolios()


@app.post("/portfolios", response_model=Portfolio)
def create_portfolio(portfolio: Portfolio) -> Portfolio:
    return data_provider.save_portfolio(portfolio)


@app.delete("/portfolios/{portfolio_id}")
def delete_portfolio(portfolio_id: str) -> dict:
    deleted = data_provider.delete_portfolio(portfolio_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return {"deleted": True}


@app.post("/portfolios/{portfolio_id}/insight", response_model=InsightResponse)
def portfolio_insight(portfolio_id: str) -> InsightResponse:
    portfolio = next((p for p in data_provider.list_portfolios() if p.id == portfolio_id), None)
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return ai_service.summarize_portfolio(portfolio)


@app.post("/backtest", response_model=BacktestResult)
def run_backtest(request: BacktestRequest) -> BacktestResult:
    try:
        return engine.run_backtest(request)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# Seed a simple example so the API returns data before persistence is wired up
@app.on_event("startup")
def _seed_examples() -> None:
    example_factor = Factor(
        id="example-factor",
        name="Momentum Tilt",
        description="Scales exposure to recent winners.",
        formula="pct_change(20) * volume.rank()",
        category="MOMENTUM",
        frequency="LOW_FREQ",
        created_at=datetime.utcnow(),
    )
    data_provider.save_factor(example_factor)

    example_portfolio = Portfolio(
        id="example-portfolio",
        name="Equal Weight Tech",
        description="Sample portfolio for demonstration.",
        allocations=[
            {"symbol": "AAPL", "weight": 0.34},
            {"symbol": "MSFT", "weight": 0.33},
            {"symbol": "GOOG", "weight": 0.33},
        ],
        created_at=datetime.utcnow(),
    )
    # Pydantic will coerce dict allocations into PortfolioAllocation objects
    data_provider.save_portfolio(example_portfolio)
