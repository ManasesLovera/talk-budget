from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.schemas.chat_message import (
    ChatMessageRead,
    ChatMessageSyncPayload,
    ChatMessageSyncResponse,
)

router = APIRouter(prefix="/chat-history", tags=["chat-history"])


@router.get("", response_model=list[ChatMessageRead])
def list_chat_history(
    conversation_id: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ChatMessageRead]:
    q = (
        db.query(ChatMessage)
        .filter(ChatMessage.owner_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
    )
    if conversation_id:
        q = q.filter(ChatMessage.conversation_id == conversation_id)
    return [ChatMessageRead.model_validate(m) for m in q.all()]


@router.get("/conversations")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[dict]:
    rows = (
        db.query(ChatMessage.conversation_id)
        .filter(ChatMessage.owner_id == current_user.id)
        .distinct()
        .order_by(ChatMessage.conversation_id)
        .all()
    )
    result: list[dict] = []
    for (cid,) in rows:
        first_msg = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.owner_id == current_user.id,
                ChatMessage.conversation_id == cid,
                ChatMessage.role == "user",
            )
            .order_by(ChatMessage.created_at.asc())
            .first()
        )
        count = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.owner_id == current_user.id,
                ChatMessage.conversation_id == cid,
            )
            .count()
        )
        result.append(
            {
                "conversation_id": cid,
                "title": first_msg.content[:80] if first_msg else "New conversation",
                "message_count": count,
            }
        )
    return result


@router.post("/sync", response_model=ChatMessageSyncResponse)
def sync_chat_messages(
    payload: ChatMessageSyncPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ChatMessageSyncResponse:
    saved = 0
    for msg in payload.messages:
        existing = (
            db.query(ChatMessage)
            .filter(
                ChatMessage.owner_id == current_user.id,
                ChatMessage.conversation_id == msg.conversation_id,
                ChatMessage.role == msg.role,
                ChatMessage.content == msg.content,
            )
            .first()
        )
        if not existing:
            db.add(
                ChatMessage(
                    conversation_id=msg.conversation_id,
                    owner_id=current_user.id,
                    role=msg.role,
                    content=msg.content,
                )
            )
            saved += 1
    db.commit()
    return ChatMessageSyncResponse(saved=saved)


@router.delete("/{conversation_id}", status_code=204)
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    db.query(ChatMessage).filter(
        ChatMessage.owner_id == current_user.id,
        ChatMessage.conversation_id == conversation_id,
    ).delete()
    db.commit()
