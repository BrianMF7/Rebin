from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from routes.infer import router as infer_router
from routes.explain import router as explain_router
from routes.event import router as event_router
from utils.supabase_client import ensure_seed_policies
from utils.settings import settings


def create_app() -> FastAPI:
    """
    Create and configure FastAPI application with CORS and routes.
    """
    app = FastAPI(title="ReBin Pro API", version="1.0.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_ORIGIN],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(infer_router, prefix="/infer", tags=["infer"])
    app.include_router(explain_router, prefix="/explain", tags=["explain"])
    app.include_router(event_router, prefix="/event", tags=["event"])

    @app.on_event("startup")
    async def startup_event() -> None:
        logger.info("Starting ReBin Pro API")
        await ensure_seed_policies()

    return app


app = create_app()
