"""
FastAPI application factory.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.clients import http as http_client
from app.clients.http import ApiError
from app.config import settings
from app.routers import addresses, feature_info, properties

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await http_client.startup()
    yield
    await http_client.shutdown()


app = FastAPI(
    title="Analytical Map Services API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["Content-Type", "Accept"],
)

@app.exception_handler(ApiError)
async def api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
    logger.error("Upstream error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=502,
        content={"detail": "Upstream service unavailable", "kind": exc.kind},
    )


app.include_router(feature_info.router, prefix="/api/v1")
app.include_router(properties.router, prefix="/api/v1")
app.include_router(addresses.router, prefix="/api/v1")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
