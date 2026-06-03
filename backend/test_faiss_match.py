import os
import sys
import numpy as np
from services.ai_pipeline import detect_and_embed_faces
from services.vector_db import vector_db

file_path = os.path.join("..", "frontend", "public", "static", "6a14930d7bb043acdbeb3090_20260525182116_WIN_20260525_13_55_44_Pro.jpg")

if not os.path.exists(file_path):
    print("File not found:", file_path)
    sys.exit(1)

print("Extracting embedding...")
embeddings = detect_and_embed_faces(file_path)

if not embeddings:
    print("No faces detected in the image!")
    sys.exit(1)

query_embedding = embeddings[0]

print("Searching FAISS...")
matched_ids = vector_db.search_faces(query_embedding, k=50)

print(f"Matched IDs: {matched_ids}")
