import numpy as np
from typing import List, Optional, Tuple
from backend.schemas.schemas import GeometricFeatures

class GeometricFeatureExtractor:
    """
    Computes rigorous normalized geometric facial measurements from 468 MediaPipe landmarks.
    All calculations are grounded in actual Euclidean distances normalized by facial dimensions.
    """

    # Landmark indices for landmarks
    LEFT_EYE_TOP = 159
    LEFT_EYE_BOTTOM = 145
    LEFT_EYE_OUTER = 33
    LEFT_EYE_INNER = 133

    RIGHT_EYE_TOP = 386
    RIGHT_EYE_BOTTOM = 374
    RIGHT_EYE_INNER = 362
    RIGHT_EYE_OUTER = 263

    LEFT_EYEBROW_MID = 105
    RIGHT_EYEBROW_MID = 334

    MOUTH_TOP_LIP = 13
    MOUTH_BOTTOM_LIP = 14
    MOUTH_CORNER_LEFT = 61
    MOUTH_CORNER_RIGHT = 291

    NOSE_TIP = 1
    NOSE_ROOT = 168
    NOSE_BOTTOM = 2
    CHIN_TIP = 152
    FOREHEAD_TOP = 10
    JAW_LEFT = 234
    JAW_RIGHT = 454

    @staticmethod
    def _euclidean_dist(p1: List[float], p2: List[float]) -> float:
        return float(np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2))

    def extract_features(
        self,
        landmarks_2d: Optional[List[List[float]]],
        bbox: Tuple[int, int, int, int],
        img_shape: Tuple[int, int]
    ) -> Optional[GeometricFeatures]:
        """
        Extracts normalized geometric features from facial landmarks and bounding box.
        If landmarks are missing, computes basic bounding box geometry.
        """
        h_img, w_img = img_shape[:2]
        bx, by, bw, bh = bbox
        
        # Bounding box geometry
        face_width = float(bw)
        face_height = float(bh)
        face_aspect_ratio = round(face_height / face_width, 3) if face_width > 0 else None

        if landmarks_2d is None or len(landmarks_2d) < 468:
            return GeometricFeatures(
                face_width=face_width,
                face_height=face_height,
                face_aspect_ratio=face_aspect_ratio
            )

        try:
            # Convert normalized coordinates to pixel coordinates for consistent geometric scales
            pts = [[lm[0] * w_img, lm[1] * h_img] for lm in landmarks_2d]

            # 1. Eye Openness (Eyelid vertical distance / Eye horizontal width)
            left_eye_h = self._euclidean_dist(pts[self.LEFT_EYE_TOP], pts[self.LEFT_EYE_BOTTOM])
            left_eye_w = max(1.0, self._euclidean_dist(pts[self.LEFT_EYE_OUTER], pts[self.LEFT_EYE_INNER]))
            eye_openness_left = round(left_eye_h / left_eye_w, 3)

            right_eye_h = self._euclidean_dist(pts[self.RIGHT_EYE_TOP], pts[self.RIGHT_EYE_BOTTOM])
            right_eye_w = max(1.0, self._euclidean_dist(pts[self.RIGHT_EYE_INNER], pts[self.RIGHT_EYE_OUTER]))
            eye_openness_right = round(right_eye_h / right_eye_w, 3)

            eye_openness_avg = round((eye_openness_left + eye_openness_right) / 2.0, 3)

            # 2. Mouth Openness & Width (normalized by face height / width)
            mouth_h = self._euclidean_dist(pts[self.MOUTH_TOP_LIP], pts[self.MOUTH_BOTTOM_LIP])
            mouth_w = self._euclidean_dist(pts[self.MOUTH_CORNER_LEFT], pts[self.MOUTH_CORNER_RIGHT])
            
            mouth_openness = round(mouth_h / max(1.0, face_height), 3)
            mouth_width = round(mouth_w / max(1.0, face_width), 3)

            # 3. Eyebrow Elevation (Eyebrow to eye center distance / face height)
            left_eye_center = [
                (pts[self.LEFT_EYE_TOP][0] + pts[self.LEFT_EYE_BOTTOM][0]) / 2.0,
                (pts[self.LEFT_EYE_TOP][1] + pts[self.LEFT_EYE_BOTTOM][1]) / 2.0
            ]
            left_brow_dist = self._euclidean_dist(pts[self.LEFT_EYEBROW_MID], left_eye_center)
            eyebrow_raise_left = round(left_brow_dist / max(1.0, face_height), 3)

            right_eye_center = [
                (pts[self.RIGHT_EYE_TOP][0] + pts[self.RIGHT_EYE_BOTTOM][0]) / 2.0,
                (pts[self.RIGHT_EYE_TOP][1] + pts[self.RIGHT_EYE_BOTTOM][1]) / 2.0
            ]
            right_brow_dist = self._euclidean_dist(pts[self.RIGHT_EYEBROW_MID], right_eye_center)
            eyebrow_raise_right = round(right_brow_dist / max(1.0, face_height), 3)

            eyebrow_elevation_avg = round((eyebrow_raise_left + eyebrow_raise_right) / 2.0, 3)

            # 4. Eye Distance (Inter-pupil distance / face width)
            eye_dist_px = self._euclidean_dist(left_eye_center, right_eye_center)
            eye_distance = round(eye_dist_px / max(1.0, face_width), 3)

            # 5. Jaw Position (Nose tip to chin / face height)
            nose_to_chin = self._euclidean_dist(pts[self.NOSE_TIP], pts[self.CHIN_TIP])
            jaw_position = round(nose_to_chin / max(1.0, face_height), 3)

            # 6. Nose to Mouth distance
            nose_to_mouth = self._euclidean_dist(pts[self.NOSE_BOTTOM], pts[self.MOUTH_TOP_LIP])
            nose_to_mouth_distance = round(nose_to_mouth / max(1.0, face_height), 3)

            # 7. Nose Wrinkle (Distance between nose root and nose tip / face height)
            nose_length = self._euclidean_dist(pts[self.NOSE_ROOT], pts[self.NOSE_TIP])
            nose_wrinkle = round(nose_length / max(1.0, face_height), 3)

            return GeometricFeatures(
                eye_openness_left=eye_openness_left,
                eye_openness_right=eye_openness_right,
                eye_openness_avg=eye_openness_avg,
                mouth_openness=mouth_openness,
                mouth_width=mouth_width,
                eyebrow_raise_left=eyebrow_raise_left,
                eyebrow_raise_right=eyebrow_raise_right,
                eyebrow_elevation_avg=eyebrow_elevation_avg,
                eye_distance=eye_distance,
                face_width=face_width,
                face_height=face_height,
                face_aspect_ratio=face_aspect_ratio,
                jaw_position=jaw_position,
                nose_to_mouth_distance=nose_to_mouth_distance,
                nose_wrinkle=nose_wrinkle
            )

        except Exception as e:
            print(f"[GeometricFeatureExtractor] Error calculating features: {e}")
            return GeometricFeatures(
                face_width=face_width,
                face_height=face_height,
                face_aspect_ratio=face_aspect_ratio
            )
