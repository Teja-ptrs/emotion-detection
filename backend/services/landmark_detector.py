import os
import urllib.request
import numpy as np
from typing import List, Optional, Tuple, Any

try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    MP_AVAILABLE = True
except ImportError:
    MP_AVAILABLE = False

class LandmarkDetector:
    """
    MediaPipe Face Landmarker for 478/468-point 3D facial landmarks.
    Supports official MediaPipe Tasks Vision API with automatic task asset management.
    """
    MODEL_URL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
    DEFAULT_TASK_PATH = "models/face_landmarker.task"

    def __init__(self, task_path: str = None, num_faces: int = 5, static_image_mode: bool = False, **kwargs):
        self.mp_available = MP_AVAILABLE
        self.landmarker = None
        self.task_path = task_path or self.DEFAULT_TASK_PATH

        if self.mp_available:
            self._init_landmarker(num_faces)

    def _init_landmarker(self, num_faces: int):
        try:
            # Ensure model file exists or download it automatically
            if not os.path.exists(self.task_path):
                os.makedirs(os.path.dirname(self.task_path), exist_ok=True)
                print(f"[LandmarkDetector] Downloading FaceLandmarker task asset from Google CDN...")
                urllib.request.urlretrieve(self.MODEL_URL, self.task_path)

            base_options = mp_python.BaseOptions(model_asset_path=self.task_path)
            options = mp_vision.FaceLandmarkerOptions(
                base_options=base_options,
                output_face_blendshapes=False,
                output_facial_transformation_matrixes=False,
                num_faces=num_faces,
                min_face_detection_confidence=0.4,
                min_face_presence_confidence=0.4,
                min_tracking_confidence=0.4
            )
            self.landmarker = mp_vision.FaceLandmarker.create_from_options(options)
            print("[LandmarkDetector] MediaPipe FaceLandmarker successfully initialized.")
        except Exception as e:
            print(f"[LandmarkDetector] Warning: Failed to initialize MediaPipe FaceLandmarker: {e}")
            self.landmarker = None

    def process_frame(self, image_rgb: np.ndarray) -> Optional[Any]:
        """
        Runs MediaPipe FaceLandmarker on an RGB uint8 image.
        """
        if self.landmarker is None or image_rgb is None or image_rgb.size == 0:
            return None

        try:
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=image_rgb)
            result = self.landmarker.detect(mp_image)
            return result
        except Exception as e:
            print(f"[LandmarkDetector] Landmark detect error: {e}")
            return None

    def get_landmarks_for_face(
        self,
        results: Any,
        face_bbox: Tuple[int, int, int, int],
        img_shape: Tuple[int, int]
    ) -> Optional[List[List[float]]]:
        """
        Matches detected FaceLandmarker mesh with the target face bounding box.
        Returns a list of 468/478 normalized [[x, y], ...] coordinates.
        """
        if results is None or not getattr(results, 'face_landmarks', None):
            return None

        h_img, w_img = img_shape[:2]
        bx, by, bw, bh = face_bbox
        face_center_x = (bx + bw / 2.0) / float(w_img)
        face_center_y = (by + bh / 2.0) / float(h_img)

        best_mesh = None
        min_dist = float('inf')

        for face_landmarks in results.face_landmarks:
            if len(face_landmarks) > 1:
                # Nose tip is landmark index 1
                nose_lm = face_landmarks[1]
                dist = np.sqrt((nose_lm.x - face_center_x) ** 2 + (nose_lm.y - face_center_y) ** 2)
                if dist < min_dist:
                    min_dist = dist
                    best_mesh = face_landmarks

        if best_mesh is not None and min_dist < 0.45:
            return [[float(lm.x), float(lm.y)] for lm in best_mesh]

        return None
