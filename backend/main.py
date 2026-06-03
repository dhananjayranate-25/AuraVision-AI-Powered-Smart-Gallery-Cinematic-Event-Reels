from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from routers import auth, events, media, guest, reels

app = FastAPI(title="AI Smart Event Gallery API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload dir exists and mount it
os.makedirs("uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="uploads"), name="static")

app.include_router(auth.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(media.router, prefix="/api")
app.include_router(guest.router, prefix="/api")
app.include_router(reels.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to AI Smart Event Gallery API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
