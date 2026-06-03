from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Form
from typing import List
import os
import shutil
from datetime import datetime
from bson import ObjectId

from models import MediaMetadata
from database import get_database
from routers.auth import get_current_user
from services.ai_pipeline import detect_and_embed_faces, assess_image_quality, detect_emotions
from services.vector_db import vector_db

router = APIRouter(prefix="/media", tags=["media"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def process_media_background(media_id: str, file_path: str):
    """
    Background AI processing pipeline.
    """
    db = get_database()
    
    # 1. Best Shot Logic (Blur Detection)
    blur_score = assess_image_quality(file_path)
    
    # 2. Emotion Tagging
    emotions = detect_emotions(file_path)
    
    # 3. Face Detection and Embeddings
    embeddings = detect_and_embed_faces(file_path)
    
    if embeddings:
        # Save to FAISS
        vector_db.add_faces(embeddings, [media_id] * len(embeddings))
        with open("debug.log", "a") as f:
            f.write(f"Background task added {len(embeddings)} face(s) to FAISS for _id: {media_id}\n")
    else:
        with open("debug.log", "a") as f:
            f.write(f"Background task found NO FACES for _id: {media_id}\n")
    
    # Update DB to mark as processed
    await db.media.update_one(
        {"_id": ObjectId(media_id)},
        {"$set": {
            "is_processed": True,
            "faces_detected": len(embeddings),
            "blur_score": blur_score,
            "emotions": emotions,
            "captions": None # Will be handled by BLIP in Phase 4
        }}
    )
    print(f"Finished AI processing for {media_id}. Found {len(embeddings)} faces.")
    print(f"Finished background processing for {media_id}")

@router.post("/upload/{event_id}")
async def upload_media(
    event_id: str,
    background_tasks: BackgroundTasks,
    folder_name: str = Form("General"),
    files: List[UploadFile] = File(...)
):
    # Mock admin user for MVP testing without frontend login
    current_user = {"id": "mock_admin_123", "is_admin": True}
        
    db = get_database()
    
    # Verify event exists (Bypass for demo event '1')
    if event_id != "1":
        try:
            event = await db.events.find_one({"_id": ObjectId(event_id)})
            if not event:
                # fallback for string ids
                event = await db.events.find_one({"_id": event_id})
            if not event:
                raise HTTPException(status_code=404, detail="Event not found")
        except:
            pass # Ignore invalid object id format for other mocks
        
    uploaded_files = []
    
    for file in files:
        # Save file locally (acting as S3 for local MVP)
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        filename = f"{event_id}_{timestamp}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        with open("debug.log", "a") as f:
            f.write(f"\n--- UPLOAD CALLED for event {event_id} ---\n")
            f.write(f"Uploaded filename: {filename}\n")
            
        # Create DB record for this media
        media_doc = {
            "event_id": event_id,
            "s3_url": f"/static/{filename}",
            "folder_name": folder_name,
            "uploaded_by": current_user["id"],
            "uploaded_at": datetime.utcnow(),
            "is_processed": False,
            "filename": file.filename
        }
        
        result = await db.media.insert_one(media_doc)
        media_id = str(result.inserted_id)
        
        with open("debug.log", "a") as f:
            f.write(f"Assigned DB _id: {media_id}\n")
            
        # Trigger background processing (AI pipeline)
        background_tasks.add_task(process_media_background, media_id, file_path)
        
        uploaded_files.append({"id": media_id, "url": media_doc["s3_url"]})
        
    return {"message": f"Successfully uploaded {len(files)} files", "files": uploaded_files}

@router.delete("/{media_id}")
async def delete_media(media_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db = get_database()
    media_item = await db.media.find_one({"_id": media_id})
    if not media_item:
        media_item = await db.media.find_one({"_id": ObjectId(media_id)})
        
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")
        
    await db.media.delete_one({"_id": media_item.get("_id")})
    
    # Try deleting file from local storage
    if media_item.get("s3_url") and media_item.get("s3_url").startswith("/static/"):
        filename = media_item["s3_url"].replace("/static/", "")
        file_path = os.path.join("uploads", filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            
    return {"message": "Media deleted successfully"}

@router.get("/event/{event_id}")
async def get_event_media(event_id: str):
    """
    Get all media for a specific event. Publicly accessible if they have the event link.
    """
    db = get_database()
    cursor = db.media.find({"event_id": event_id})
    media_list = await cursor.to_list(length=1000)
    
    for m in media_list:
        m["id"] = str(m["_id"])
        del m["_id"]
        
    return media_list
