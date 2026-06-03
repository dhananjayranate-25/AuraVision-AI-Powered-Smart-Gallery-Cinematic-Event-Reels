import json
import os
import asyncio
from datetime import datetime
from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if MONGO_URI:
    print(f"🔗 MongoDB Connection String Found! Connecting to Atlas...")
else:
    print(f"⚠️ No MONGO_URI found in .env. Using local JSON Database.")

DB_FILE = "local_db.json"

class MockCursor:
    def __init__(self, data):
        self.data = data
    async def to_list(self, length=1000):
        return self.data[:length]

class MockCollection:
    def __init__(self, name):
        self.name = name

    def _load(self):
        if not os.path.exists(DB_FILE):
            return {}
        with open(DB_FILE, "r") as f:
            try:
                return json.load(f)
            except:
                return {}

    def _save(self, data):
        with open(DB_FILE, "w") as f:
            json.dump(data, f, default=str)

    async def find_one(self, query):
        data = self._load()
        items = data.get(self.name, [])
        
        for item in items:
            match = True
            for k, v in query.items():
                if k == "_id":
                    if str(item.get("_id")) != str(v): match = False
                elif item.get(k) != v:
                    match = False
            if match:
                return item
        return None

    async def insert_one(self, doc):
        data = self._load()
        if self.name not in data:
            data[self.name] = []
            
        doc["_id"] = str(ObjectId())
        data[self.name].append(doc)
        self._save(data)
        
        class MockResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return MockResult(doc["_id"])

    async def update_one(self, query, update):
        data = self._load()
        items = data.get(self.name, [])
        for item in items:
            match = True
            for k, v in query.items():
                if k == "_id" and str(item.get("_id")) != str(v): match = False
            if match:
                if "$set" in update:
                    for sk, sv in update["$set"].items():
                        item[sk] = sv
                break
        self._save(data)
        return True

    def find(self, query):
        data = self._load()
        items = data.get(self.name, [])
        results = []
        for item in items:
            match = True
            for k, v in query.items():
                if k == "_id" and isinstance(v, dict) and "$in" in v:
                    string_ids = [str(vid) for vid in v["$in"]]
                    if str(item.get("_id")) not in string_ids: match = False
                elif k != "_id" and item.get(k) != v:
                    match = False
            if match:
                results.append(item)
        return MockCursor(results)

    async def delete_one(self, query):
        data = self._load()
        items = data.get(self.name, [])
        for i, item in enumerate(items):
            match = True
            for k, v in query.items():
                if k == "_id" and str(item.get("_id")) != str(v): match = False
                elif k != "_id" and item.get(k) != v: match = False
            if match:
                del items[i]
                self._save(data)
                return True
        return False

    async def delete_many(self, query):
        data = self._load()
        items = data.get(self.name, [])
        new_items = []
        deleted_count = 0
        for item in items:
            match = True
            for k, v in query.items():
                if k == "_id" and str(item.get("_id")) != str(v): match = False
                elif k != "_id" and item.get(k) != v: match = False
            if match:
                deleted_count += 1
            else:
                new_items.append(item)
        data[self.name] = new_items
        self._save(data)
        class MockResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return MockResult(deleted_count)

class MockAsyncDB:
    def __init__(self):
        self.events = MockCollection("events")
        self.media = MockCollection("media")
        self.users = MockCollection("users")

db_instance = MockAsyncDB()

def get_database():
    if MONGO_URI:
        client = AsyncIOMotorClient(MONGO_URI)
        print("✅ Connected to MongoDB Atlas Cloud Database!")
        return client.smartevent
    return db_instance
