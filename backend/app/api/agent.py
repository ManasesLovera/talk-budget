from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.agent import ChatRequest, ChatResponse
from app.services.ai_gateway import get_ai_gateway

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatResponse:
    gateway = get_ai_gateway(db=db, user=current_user)
    reply = gateway.chat([m.model_dump() for m in payload.messages])
    return ChatResponse(reply=reply)
