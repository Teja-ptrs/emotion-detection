import cv2
import numpy as np
from typing import List, Tuple

class FaceDetector:
    """
    Real-time Face Detector using OpenCV Haar Cascades with adaptive preprocessing.
    Provides bounding boxes [x, y, w, h] for single and multi-face scenarios.
    """
    def __init__(self, cascade_path: str = None, min_face_size: Tuple[int, int] = (40, 40)):
        if cascade_path:
            self.detector = cv2.CascadeClassifier(cascade_path)
        else:
            default_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            self.detector = cv2.CascadeClassifier(default_path)
            
        self.min_face_size = min_face_size

    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detects faces in a BGR or RGB image.
        Returns a list of bounding boxes (x, y, w, h).
        """
        if image is None or image.size == 0:
            return []

        # Convert to grayscale for Haar detection
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image

        # Histogram equalization for contrast normalization
        gray_eq = cv2.equalizeHist(gray)

        # Multi-scale face detection
        faces = self.detector.detectMultiScale(
            gray_eq,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=self.min_face_size,
            flags=cv2.CASCADE_SCALE_IMAGE
        )

        h_img, w_img = image.shape[:2]
        valid_boxes = []

        for (x, y, w, h) in faces:
            # Bound coordinates within image limits
            x1 = max(0, int(x))
            y1 = max(0, int(y))
            x2 = min(w_img, int(x + w))
            y2 = min(h_img, int(y + h))
            
            box_w = x2 - x1
            box_h = y2 - y1

            if box_w >= self.min_face_size[0] and box_h >= self.min_face_size[1]:
                valid_boxes.append((x1, y1, box_w, box_h))

        # Sort by x coordinate for deterministic ordering
        valid_boxes.sort(key=lambda b: b[0])
        return valid_boxes
