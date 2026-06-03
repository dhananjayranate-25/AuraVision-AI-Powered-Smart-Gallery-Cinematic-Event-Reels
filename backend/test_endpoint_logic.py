import os
import sys
import numpy as np
from services.ai_pipeline import detect_and_embed_faces
from services.vector_db import vector_db
from database import get_database
from bson import ObjectId
import asyncio

async def test():
    file_path = os.path.join('uploads', '1_20260526052732_lena.jpg')
    print('Extracting embedding...')
    embeddings = detect_and_embed_faces(file_path)
    
    if not embeddings:
        print('No faces detected in the image!')
        sys.exit(1)

    query_embedding = embeddings[0]
    print('Searching FAISS...')
    matched_media_ids = vector_db.search_faces(query_embedding, k=50)
    print(f'Matched IDs: {matched_media_ids}')
    
    db = get_database()
    cursor = db.media.find({
        "_id": {"$in": [ObjectId(mid) for mid in matched_media_ids]},
        "event_id": "1"
    })
    
    media_list = await cursor.to_list(100)
    for m in media_list:
        m["id"] = str(m.pop("_id"))
        
    print("Media:", media_list)

asyncio.run(test())
