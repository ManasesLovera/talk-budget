import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    agent,
    auth,
    categories,
    chat_history,
    transaction_templates,
    transactions,
    users,
    wallets,
)
from app.core.config import settings
from app.services.seed import init_db

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables + seed the single default admin user.
    logger.info("Initializing database and seeding admin user...")
    init_db()
    yield
    # Shutdown hook (nothing to clean up yet).


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(wallets.router, prefix=api_prefix)
app.include_router(categories.router, prefix=api_prefix)
app.include_router(transactions.router, prefix=api_prefix)
app.include_router(transaction_templates.router, prefix=api_prefix)
app.include_router(agent.router, prefix=api_prefix)
app.include_router(chat_history.router, prefix=api_prefix)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "service": settings.PROJECT_NAME}
