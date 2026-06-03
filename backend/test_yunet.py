import cv2
import os

print(f"OpenCV version: {cv2.__version__}")

yunet_path = 'face_detection_yunet_2023mar.onnx'
sface_path = 'face_recognition_sface_2021dec.onnx'

detector = cv2.FaceDetectorYN.create(yunet_path, "", (320, 320))
recognizer = cv2.FaceRecognizerSF.create(sface_path, "")

# Create a simple synthetic image if there's no photo
import urllib.request
urllib.request.urlretrieve("https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg", "lena.jpg")

img = cv2.imread("lena.jpg")
height, width, _ = img.shape
detector.setInputSize((width, height))
status, faces = detector.detect(img)

print(f"Status: {status}")
if faces is not None:
    print(f"Detected {len(faces)} faces.")
    for face in faces:
        aligned_face = recognizer.alignCrop(img, face)
        feature = recognizer.feature(aligned_face)
        print("Extracted feature shape:", feature.shape)
else:
    print("No faces detected.")
