import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.smart_gallery
    
    docs = await db.media.find({}).to_list(100)
    print(f"Total media items: {len(docs)}")
    for d in docs:
        print(f"ID: {d['_id']}, Event ID: {d.get('event_id')}, Processed: {d.get('is_processed')}, Faces: {d.get('faces_detected')}")
        
    print("\nEvents:")
    events = await db.events.find({}).to_list(100)
    for e in events:
         print(f"Event: {e.get('name')}, ID: {e['_id']}")

asyncio.run(check_db())
