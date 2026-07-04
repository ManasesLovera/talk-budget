"""Database bootstrapping: table creation + default admin seed."""

import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models.category import Category
from app.models.user import User, UserRole

logger = logging.getLogger("uvicorn.error")

DEFAULT_CATEGORIES = [
    ("Salary", "banknote", "#1eb489"),
    ("Groceries", "shopping-cart", "#43cba0"),
    ("Auto & transport", "car", "#0f6b56"),
    ("Housing", "home", "#12876a"),
    ("Utilities", "plug", "#7fe1c0"),
    ("Dining out", "utensils", "#f59e0b"),
    ("Entertainment", "clapperboard", "#0d9488"),
    ("Health", "heart-pulse", "#ef4444"),
    ("Shopping", "shopping-bag", "#8b5cf6"),
    ("Other", "circle", "#64748b"),
]


def create_tables() -> None:
    """Create all tables (dev convenience; Alembic owns prod migrations)."""
    Base.metadata.create_all(bind=engine)


def seed_admin(db: Session) -> None:
    """Seed exactly ONE default admin user from env vars if absent."""
    existing = db.query(User).filter(User.username == settings.ADMIN_USERNAME).first()
    if existing:
        logger.info("Admin user '%s' already exists — skipping seed.", settings.ADMIN_USERNAME)
        return

    admin = User(
        username=settings.ADMIN_USERNAME,
        email=settings.ADMIN_EMAIL,
        hashed_password=hash_password(settings.ADMIN_PASSWORD),
        role=UserRole.admin,
    )
    db.add(admin)
    db.commit()
    logger.info("Seeded default admin user '%s'.", settings.ADMIN_USERNAME)


def seed_default_categories(db: Session) -> None:
    """Seed a handful of global (owner_id=None) categories if none exist yet."""
    existing = db.query(Category).filter(Category.owner_id.is_(None)).first()
    if existing:
        return

    for name, icon, color in DEFAULT_CATEGORIES:
        db.add(Category(name=name, icon=icon, color=color, owner_id=None))
    db.commit()
    logger.info("Seeded %d default categories.", len(DEFAULT_CATEGORIES))


def init_db() -> None:
    create_tables()
    db = SessionLocal()
    try:
        seed_admin(db)
        seed_default_categories(db)
    finally:
        db.close()
