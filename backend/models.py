from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    is_admin: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class EventBase(BaseModel):
    name: str
    description: Optional[str] = None
    date: datetime

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: str
    admin_id: str
    qr_code_url: Optional[str] = None
    created_at: datetime
    photoCount: int = 0
    
class MediaMetadata(BaseModel):
    event_id: str
    s3_url: str
    folder_name: str = "General"
    thumbnail_url: Optional[str] = None
    is_processed: bool = False
    faces_detected: int = 0
    blur_score: float = 0.0
    emotions: Optional[dict] = None
    captions: Optional[str] = None
