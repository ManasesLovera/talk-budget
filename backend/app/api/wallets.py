from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.wallet import WalletCreate, WalletRead

router = APIRouter(prefix="/wallets", tags=["wallets"])


@router.get("", response_model=list[WalletRead])
def list_wallets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Wallet]:
    return db.query(Wallet).filter(Wallet.owner_id == current_user.id).all()


@router.post("", response_model=WalletRead, status_code=201)
def create_wallet(
    payload: WalletCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Wallet:
    wallet = Wallet(**payload.model_dump(), owner_id=current_user.id)
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    return wallet
