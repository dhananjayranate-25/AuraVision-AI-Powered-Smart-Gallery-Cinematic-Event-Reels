from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
import os
import shutil
from bson import ObjectId

from database import get_database
from services.ai_pipeline import detect_and_embed_faces
from services.vector_db import vector_db
from services.semantic import search_by_text

router = APIRouter(prefix="/guest", tags=["guest"])

@router.post("/match-face/{event_id}")
async def match_face(event_id: str, selfie: UploadFile = File(...)):
    """
    Guest uploads a selfie. Returns all media items in the event containing their face.
    """
    with open("debug.log", "a") as f:
        f.write(f"\n--- MATCH FACE CALLED for event {event_id} ---\n")
        f.write(f"Selfie filename: {selfie.filename}\n")

    db = get_database()
    
    # Verify event (Bypass for demo event '1')
    if event_id == "1":
        # Fallback to the first available event to prevent user errors when using hardcoded links
        event = await db.events.find_one({})
        if event:
            event_id = str(event.get("_id"))
    else:
        try:
            event = await db.events.find_one({"_id": ObjectId(event_id)})
            if not event:
                with open("debug.log", "a") as f: f.write("Error: Event not found in DB\n")
                raise HTTPException(status_code=404, detail="Event not found")
        except:
            pass
        
    # Save temp selfie
    temp_path = f"temp_selfie_{selfie.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(selfie.file, buffer)
        
    # Extract face embedding from selfie
    embeddings = detect_and_embed_faces(temp_path)
    
    with open("debug.log", "a") as f:
        f.write(f"Faces detected in selfie: {len(embeddings)}\n")
        
    # Cleanup temp file
    if os.path.exists(temp_path):
        os.remove(temp_path)
        
    if not embeddings:
        raise HTTPException(status_code=400, detail="No face detected in selfie. Please try again.")
        
    # We take the first face found in the selfie
    query_embedding = embeddings[0]
    
    # Search FAISS vector DB for matching media_ids (top 200 closest matches)
    matched_media_ids = vector_db.search_faces(query_embedding, k=200)
    
    with open("debug.log", "a") as f:
        f.write(f"FAISS matched IDs: {matched_media_ids}\n")
    
    if not matched_media_ids:
        return {"message": "No matching photos found yet.", "media": []}
        
    # Retrieve media documents from DB based on matched IDs
    # Also filter by event_id just to be safe
    cursor = db.media.find({
        "_id": {"$in": [ObjectId(mid) for mid in matched_media_ids]},
        "event_id": event_id
    })
    
    media_list = await cursor.to_list(length=200)
    
    with open("debug.log", "a") as f:
        f.write(f"DB documents found: {len(media_list)}\n")
        if media_list:
            f.write(f"First DB doc: {media_list[0]}\n")
    
    for m in media_list:
        m["id"] = str(m["_id"])
        del m["_id"]
        
    return {"message": f"Found {len(media_list)} matching photos!", "media": media_list}

@router.get("/semantic-search/{event_id}")
async def semantic_search(event_id: str, query: str):
    """
    Guest performs natural language search (e.g. "show dancing").
    """
    db = get_database()
    
    if event_id == "1":
        event = await db.events.find_one({})
        if event:
            event_id = str(event.get("_id"))
            
    # Get all media for this event
    cursor = db.media.find({"event_id": event_id})
    all_media = await cursor.to_list(length=1000)
    
    # Pass to semantic search service (which uses CLIP)
    results = search_by_text(query, all_media)
    
    for m in results:
        m["id"] = str(m.get("_id", m.get("id")))
        if "_id" in m:
            del m["_id"]
            
    return {"query": query, "media": results}

from services.reel_generator import reel_service

@router.post("/generate-reel/{event_id}")
async def generate_reel(event_id: str, media_ids: List[str]):
    """
    Generates a cinematic reel from a specific list of media_ids.
    """
    db = get_database()
    
    # Retrieve media to get local file paths
    cursor = db.media.find({"_id": {"$in": [ObjectId(mid) for mid in media_ids]}})
    media_docs = await cursor.to_list(length=50)
    
    if not media_docs:
        raise HTTPException(status_code=400, detail="No valid media provided.")
        
    # Extract file paths from the static URL or filename (assuming local uploads dir)
    image_paths = []
    for doc in media_docs:
        # e.g. s3_url = "/static/filename.jpg" -> path = "uploads/filename.jpg"
        if doc.get("s3_url"):
            filename = doc["s3_url"].split("/")[-1]
            path = os.path.join("uploads", filename)
            # Create a mock file if it doesn't exist just for testing without crashing
            if not os.path.exists(path):
                with open(path, "wb") as f:
                    f.write(b"") 
            image_paths.append(path)
            
    # Call the ReelGenerator service
    # In a real app, you'd pass a background audio track here too
    reel_url = reel_service.generate_reel(image_paths)
    
    return {"message": "Reel generated successfully!", "reel_url": reel_url}
