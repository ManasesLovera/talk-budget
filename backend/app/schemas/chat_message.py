from datetime import datetime

from pydantic import BaseModel


class ChatMessageCreate(BaseModel):
    role: str
    content: str
    conversation_id: str


class ChatMessageRead(BaseModel):
    id: int
    conversation_id: str
    role: str
    content: str
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True


class ChatMessageSyncPayload(BaseModel):
    messages: list[ChatMessageCreate]


class ChatMessageSyncResponse(BaseModel):
    saved: int
