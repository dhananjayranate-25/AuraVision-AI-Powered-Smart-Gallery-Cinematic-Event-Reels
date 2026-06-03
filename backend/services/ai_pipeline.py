import cv2
import numpy as np

# We use try/except so the app doesn't crash if heavy ML models fail to install on Windows
try:
    from insightface.app import FaceAnalysis
    app = FaceAnalysis(name='buffalo_l')
    app.prepare(ctx_id=0, det_size=(640, 640))
    INSIGHTFACE_AVAILABLE = True
except Exception as e:
    print(f"Warning: InsightFace not available. Using mock embeddings. Error: {e}")
    INSIGHTFACE_AVAILABLE = False

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except Exception as e:
    print(f"Warning: DeepFace not available. Emotion detection will be mocked. Error: {e}")
    DEEPFACE_AVAILABLE = False

import os

# Initialize OpenCV Face Models (YuNet + SFace) for lightweight face recognition
try:
    yunet_path = os.path.join(os.path.dirname(__file__), '..', 'face_detection_yunet_2023mar.onnx')
    sface_path = os.path.join(os.path.dirname(__file__), '..', 'face_recognition_sface_2021dec.onnx')
    detector = cv2.FaceDetectorYN.create(yunet_path, "", (320, 320), score_threshold=0.6)
    recognizer = cv2.FaceRecognizerSF.create(sface_path, "")
    OPENCV_FACE_AVAILABLE = True
except Exception as e:
    print(f"Warning: OpenCV Face Models not found. Fallback to mock. Error: {e}")
    OPENCV_FACE_AVAILABLE = False

def detect_and_embed_faces(image_path):
    """
    Returns a list of 128d face embeddings found in the image using SFace.
    """
    try:
        from PIL import Image, ImageOps
        import pillow_heif
        pillow_heif.register_heif_opener()

        # Open with PIL to handle EXIF rotation and HEIC formats
        pil_img = Image.open(image_path)
        pil_img = ImageOps.exif_transpose(pil_img)
        
        # Resize if too large to prevent YuNet from failing or being too slow
        MAX_SIZE = 1024
        if pil_img.width > MAX_SIZE or pil_img.height > MAX_SIZE:
            pil_img.thumbnail((MAX_SIZE, MAX_SIZE), Image.Resampling.LANCZOS)
            
        # Convert PIL to cv2 (RGB to BGR)
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    except Exception as e:
        print(f"PIL Image load error: {e}")
        # Fallback to pure cv2
        img = cv2.imread(image_path)
        
    if img is None:
        return []

    if OPENCV_FACE_AVAILABLE:
        height, width, _ = img.shape
        # Set YuNet input size to match the image precisely
        detector.setInputSize((width, height))
        _, faces = detector.detect(img)
        
        # If no face is found, try rotating 90, 180, 270 degrees (very common for mobile selfies ignoring EXIF)
        if faces is None:
            for angle in [cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_180, cv2.ROTATE_90_COUNTERCLOCKWISE]:
                rotated_img = cv2.rotate(img, angle)
                r_height, r_width, _ = rotated_img.shape
                detector.setInputSize((r_width, r_height))
                _, faces = detector.detect(rotated_img)
                if faces is not None:
                    img = rotated_img
                    break

        if faces is None:
            return []
        
        embeddings = []
        for face in faces:
            try:
                aligned_face = recognizer.alignCrop(img, face)
                feature = recognizer.feature(aligned_face).flatten()
                norm = np.linalg.norm(feature)
                if norm > 0:
                    feature = feature / norm
                embeddings.append(feature)
            except Exception as e:
                print(f"SFace error: {e}")
                continue
        return embeddings
        
    return [np.random.rand(128).astype('float32')]

def assess_image_quality(image_path):
    """
    Returns blur score using Laplacian variance. Lower = more blurred.
    Typically < 100 is considered blurry.
    """
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return 0.0
    return cv2.Laplacian(img, cv2.CV_64F).var()

def detect_emotions(image_path):
    """
    Detects emotion of the primary face using DeepFace.
    """
    if not DEEPFACE_AVAILABLE:
        return {"dominant_emotion": "happy"}
        
    try:
        # DeepFace analyze returns a list of dictionaries
        result = DeepFace.analyze(img_path=image_path, actions=['emotion'], enforce_detection=False)
        if isinstance(result, list):
            result = result[0]
        return result.get('emotion', {"dominant_emotion": "neutral"})
    except Exception as e:
        print(f"DeepFace error: {e}")
        return {"dominant_emotion": "neutral"}
