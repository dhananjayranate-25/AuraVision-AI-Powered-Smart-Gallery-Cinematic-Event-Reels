import cv2
import numpy as np
import os

yunet_path = 'face_detection_yunet_2023mar.onnx'
sface_path = 'face_recognition_sface_2021dec.onnx'

detector = cv2.FaceDetectorYN.create(yunet_path, "", (320, 320))
recognizer = cv2.FaceRecognizerSF.create(sface_path, "")

img = cv2.imread("lena.jpg")
height, width, _ = img.shape
detector.setInputSize((width, height))
_, faces = detector.detect(img)
aligned_face = recognizer.alignCrop(img, faces[0])
feature = recognizer.feature(aligned_face)
feature = feature.flatten()

print("Norm:", np.linalg.norm(feature))

# Create a slightly different image
img2 = cv2.flip(img, 1)
_, faces2 = detector.detect(img2)
aligned_face2 = recognizer.alignCrop(img2, faces2[0])
feature2 = recognizer.feature(aligned_face2).flatten()

print("Dist to flipped:", np.linalg.norm(feature - feature2)**2)

# Unnormalized vector test?
if np.linalg.norm(feature) > 1.1:
    print("WARNING: Feature is NOT normalized!")
