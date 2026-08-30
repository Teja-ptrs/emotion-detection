import os
import sys
import argparse
import cv2
import numpy as np

# Ensure root project path is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.core.config import settings
from backend.services.face_detector import FaceDetector
from backend.services.emotion_classifier import EmotionClassifier

def run_test_on_image(image_path: str, model_path: str = "models/emotion_model.keras"):
    """
    Runs face detection, cropping, normalization, and CNN emotion recognition on a given image file.
    """
    if not os.path.exists(image_path):
        print(f"[ERROR] Image not found: {image_path}")
        return

    print(f"[INFO] Testing image: {image_path}")
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        print("[ERROR] Could not read image.")
        return

    detector = FaceDetector()
    classifier = EmotionClassifier(model_path=model_path)

    if not classifier.is_loaded:
        print(f"[ERROR] Emotion model not loaded from '{model_path}'.")
        print("Please verify the model file exists.")
        return

    faces = detector.detect_faces(img_bgr)
    print(f"[INFO] Faces detected in image: {len(faces)}")

    if len(faces) == 0:
        print("[WARNING] No faces detected by Haar Cascade. Testing center crop as fallback.")
        h, w = img_bgr.shape[:2]
        faces = [(0, 0, w, h)]

    for idx, (x, y, w, h) in enumerate(faces, start=1):
        face_crop = img_bgr[y:y+h, x:x+w]
        pred_res = classifier.predict(face_crop, apply_smoothing=False)
        
        if pred_res is None:
            print(f"Face #{idx}: Could not compute prediction.")
            continue

        emotion, confidence, probs = pred_res
        print("\n" + "-" * 40)
        print(f"Face #{idx} Detection (BBox: x={x}, y={y}, w={w}, h={h}):")
        print(f"  PREDICTED EMOTION : {emotion.upper()}")
        print(f"  CONFIDENCE        : {confidence * 100:.2f}%")
        print("  Probability Distribution:")
        for cls_name, prob in probs.items():
            bar = "#" * int(prob * 30)
            print(f"    {cls_name.ljust(10)}: {prob * 100:5.1f}% | {bar}")
        print("-" * 40)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Emotion CNN Model on an Image")
    parser.add_argument("--image", type=str, required=True, help="Path to test image file")
    parser.add_argument("--model", type=str, default="models/emotion_model.keras", help="Path to trained model")
    args = parser.parse_args()

    run_test_on_image(args.image, args.model)
