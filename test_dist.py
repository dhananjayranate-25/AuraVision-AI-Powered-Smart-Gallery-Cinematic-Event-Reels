import cv2
import numpy as np
import sys

def get_emb(img_path):
    img = cv2.imread(img_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return None
    img_resized = cv2.resize(img, (16, 32))
    embedding = img_resized.flatten().astype('float32')
    norm = np.linalg.norm(embedding)
    if norm > 0:
        embedding = embedding / norm
    return embedding

emb1 = get_emb('uploads/test1.jpg') # I need to pick a real file
