import faiss
import numpy as np
import pickle
import os

INDEX_FILE = "faiss_index.bin"
METADATA_FILE = "faiss_metadata.pkl"
DIMENSION = 128 # Standard for many face models (InsightFace ArcFace)

class FaceVectorDB:
    def __init__(self):
        self.dimension = DIMENSION
        if os.path.exists(INDEX_FILE) and os.path.exists(METADATA_FILE):
            self.index = faiss.read_index(INDEX_FILE)
            with open(METADATA_FILE, "rb") as f:
                self.metadata = pickle.load(f)
        else:
            self.index = faiss.IndexFlatL2(self.dimension)
            self.metadata = [] # List to map faiss integer IDs to our DB media_ids
            
    def add_faces(self, embeddings, media_ids):
        """
        embeddings: list of numpy arrays or a 2D numpy array (N x 128)
        media_ids: list of media_id strings corresponding to the faces
        """
        if not embeddings:
            return
            
        embeddings_np = np.array(embeddings).astype('float32')
        if len(embeddings_np.shape) == 1:
            embeddings_np = np.expand_dims(embeddings_np, axis=0)
            
        self.index.add(embeddings_np)
        self.metadata.extend(media_ids)
        
        self.save()
        
    def search_faces(self, query_embedding, k=10):
        """
        query_embedding: numpy array of shape (512,)
        returns list of unique media_ids
        """
        if self.index.ntotal == 0:
            return []
            
        query_np = np.array(query_embedding).astype('float32')
        if len(query_np.shape) == 1:
            query_np = np.expand_dims(query_np, axis=0)
            
        distances, indices = self.index.search(query_np, k)
        
        results = []
        # distances is a 2D array, indices is a 2D array
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1 and idx < len(self.metadata):
                # Apply distance threshold to prevent false positives
                # VGG-Face L2 Euclidean threshold is theoretically 1.17. We use 1.25 to be slightly more forgiving for event photos with bad lighting.
                if dist < 1.25:
                    results.append(self.metadata[idx])
                
        # Return unique media_ids
        return list(set(results))
        
    def save(self):
        faiss.write_index(self.index, INDEX_FILE)
        with open(METADATA_FILE, "wb") as f:
            pickle.dump(self.metadata, f)

# Singleton instance
vector_db = FaceVectorDB()
