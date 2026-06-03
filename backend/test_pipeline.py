import cv2
import numpy as np
import os
import sys

# Import our backend services
from services.ai_pipeline import detect_and_embed_faces
from services.vector_db import FaceVectorDB

def test_pipeline():
    print("Testing Face Pipeline...")
    
    # 1. Generate embeddings for Lena
    img_path = "lena.jpg"
    embeddings = detect_and_embed_faces(img_path)
    
    if not embeddings:
        print("ERROR: No faces detected in lena.jpg!")
        return
        
    print(f"Detected {len(embeddings)} faces. Embedding shape: {embeddings[0].shape}")
    print(f"Embedding norm: {np.linalg.norm(embeddings[0])}")
    
    # 2. Add to Vector DB
    db = FaceVectorDB()
    db.add_faces(embeddings, ["lena_test_id"])
    print(f"Added to VectorDB. DB size: {len(db.metadata)}")
    
    # 3. Search for the exact same embedding
    results = db.search_faces(embeddings[0])
    print(f"Search results for exact match: {results}")
    
    if "lena_test_id" not in results:
        print("ERROR: Failed to find exact match!")
        
    # 4. Search for flipped lena
    img_flipped = cv2.flip(cv2.imread(img_path), 1)
    cv2.imwrite("lena_flipped.jpg", img_flipped)
    embeddings_flipped = detect_and_embed_faces("lena_flipped.jpg")
    
    if not embeddings_flipped:
        print("ERROR: No faces detected in flipped lena!")
        return
        
    results2 = db.search_faces(embeddings_flipped[0])
    print(f"Search results for flipped match: {results2}")
    
    if "lena_test_id" not in results2:
        print("ERROR: Failed to find flipped match! Threshold might be too low.")
    
    # Clean up test DB
    if os.path.exists('faiss_index.bin'): os.remove('faiss_index.bin')
    if os.path.exists('metadata.pkl'): os.remove('metadata.pkl')

if __name__ == "__main__":
    test_pipeline()
