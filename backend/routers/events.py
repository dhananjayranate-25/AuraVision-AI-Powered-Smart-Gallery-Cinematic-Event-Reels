from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime

from models import EventCreate, EventResponse
from database import get_database
from routers.auth import get_current_user

router = APIRouter(prefix="/events", tags=["events"])

@router.post("/", response_model=EventResponse)
async def create_event(event: EventCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized to create events")
    
    db = get_database()
    
    event_dict = event.dict()
    event_dict["admin_id"] = current_user["id"]
    event_dict["created_at"] = datetime.utcnow()
    # Mocking QR code URL for now
    event_dict["qr_code_url"] = f"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=event_" 
    
    result = await db.events.insert_one(event_dict)
    
    event_dict["id"] = str(result.inserted_id)
    event_dict["qr_code_url"] += event_dict["id"]
    
    # Update QR code URL in DB
    await db.events.update_one({"_id": result.inserted_id}, {"$set": {"qr_code_url": event_dict["qr_code_url"]}})
    
    event_dict.pop("_id", None)
    
    return event_dict

@router.get("/", response_model=List[EventResponse])
async def list_events(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.events.find({"admin_id": current_user["id"]})
    events = await cursor.to_list(length=100)
    
    # Format ids and fetch photo counts
    for e in events:
        e["id"] = str(e["_id"])
        media_cursor = db.media.find({"event_id": e["id"]})
        media_items = await media_cursor.to_list(length=10000)
        e["photoCount"] = len(media_items)
        
    return events

@router.get("/{event_id}", response_model=EventResponse)
async def get_event(event_id: str):
    db = get_database()
    try:
        event = await db.events.find_one({"_id": ObjectId(event_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid event ID")
        
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    event["id"] = str(event["_id"])
    return event

@router.delete("/{event_id}")
async def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db = get_database()
    
    event = await db.events.find_one({"_id": event_id})
    if not event:
        # Fallback for ObjectId
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    # Delete media
    await db.media.delete_many({"event_id": event_id})
    # Delete event
    await db.events.delete_one({"_id": event.get("_id")})
    
    return {"message": "Event deleted successfully"}
