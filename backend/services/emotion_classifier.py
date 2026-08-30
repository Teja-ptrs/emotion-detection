import os
import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple
from collections import deque
from backend.core.config import settings

class EmotionClassifier:
    """
    CNN Emotion Classifier inference engine.
    Processes 48x48 grayscale face crops, performs normalization, executes CNN inference,
    and applies optional temporal smoothing per face ID.
    """
    def __init__(self, model_path: str = None, smoothing_window: int = None):
        self.model_path = model_path or settings.MODEL_PATH
        self.smoothing_window = smoothing_window or settings.TEMPORAL_SMOOTHING_WINDOW
        self.emotion_classes = settings.EMOTION_CLASSES
        self.model = None
        self.is_loaded = False
        self.smoothing_buffers: Dict[int, deque] = {}

        self.load_model()

    def load_model(self) -> bool:
        """
        Attempts to load the trained Keras CNN model.
        Returns True if loaded, False otherwise.
        """
        if not os.path.exists(self.model_path):
            print(f"[EmotionClassifier] Model file not found at: {self.model_path}")
            self.is_loaded = False
            self.model = None
            return False

        try:
            import tensorflow as tf
            # Load Keras model (.keras or .h5 format)
            self.model = tf.keras.models.load_model(self.model_path)
            self.is_loaded = True
            print(f"[EmotionClassifier] Successfully loaded model from {self.model_path}")
            return True
        except Exception as e:
            print(f"[EmotionClassifier] Failed to load model from {self.model_path}: {e}")
            self.is_loaded = False
            self.model = None
            return False

    def preprocess_face(self, face_bgr: np.ndarray) -> Optional[np.ndarray]:
        """
        Converts BGR face crop into 48x48 Grayscale, normalized in range [0, 1].
        Returns shape (1, 48, 48, 1).
        """
        if face_bgr is None or face_bgr.size == 0:
            return None

        try:
            # Convert to grayscale
            if len(face_bgr.shape) == 3:
                gray = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2GRAY)
            else:
                gray = face_bgr

            # Resize to exact FER-2013 dimensions (48x48)
            resized = cv2.resize(gray, (48, 48), interpolation=cv2.INTER_AREA)

            # Normalize pixel intensities to match the exact training input scale
            # The model weights were trained with ImageDataGenerator(rescale=1/255) on float32 [0, 1] arrays
            normalized = (resized.astype("float32") / 255.0) / 255.0

            # Expand dimensions to match CNN input batch shape: (1, 48, 48, 1)
            tensor = np.expand_dims(normalized, axis=-1)
            tensor = np.expand_dims(tensor, axis=0)
            return tensor
        except Exception as e:
            print(f"[EmotionClassifier] Preprocessing error: {e}")
            return None

    def predict(
        self,
        face_bgr: np.ndarray,
        face_id: Optional[int] = None,
        apply_smoothing: bool = True
    ) -> Optional[Tuple[str, float, Dict[str, float]]]:
        """
        Executes genuine CNN prediction on face image.
        Returns:
            (predicted_emotion, confidence, probabilities_dict)
            or None if model is unavailable or image is invalid.
        """
        if not self.is_loaded or self.model is None:
            return None

        tensor = self.preprocess_face(face_bgr)
        if tensor is None:
            return None

        try:
            # Genuine CNN inference (softmax output across 7 classes)
            preds = self.model.predict(tensor, verbose=0)[0]
            
            # Verify valid numerical output
            preds = np.nan_to_num(preds, nan=1.0 / len(self.emotion_classes))
            sum_preds = np.sum(preds)
            if sum_preds > 0:
                raw_probs = preds / sum_preds
            else:
                raw_probs = np.ones(len(self.emotion_classes)) / len(self.emotion_classes)

            # Apply temporal smoothing per face_id if requested
            if apply_smoothing and face_id is not None:
                if face_id not in self.smoothing_buffers:
                    self.smoothing_buffers[face_id] = deque(maxlen=self.smoothing_window)
                
                self.smoothing_buffers[face_id].append(raw_probs)
                
                # Exponential moving average / window average
                smoothed_arr = np.mean(np.array(self.smoothing_buffers[face_id]), axis=0)
                smoothed_arr = smoothed_arr / np.sum(smoothed_arr)
                final_probs = smoothed_arr
            else:
                final_probs = raw_probs

            # Format probabilities dictionary
            prob_dict = {
                cls_name: round(float(final_probs[i]), 4)
                for i, cls_name in enumerate(self.emotion_classes)
            }

            # Top emotion and confidence
            top_idx = int(np.argmax(final_probs))
            top_emotion = self.emotion_classes[top_idx]
            confidence = round(float(final_probs[top_idx]), 4)

            return top_emotion, confidence, prob_dict

        except Exception as e:
            print(f"[EmotionClassifier] Inference error: {e}")
            return None

    def reset_smoothing(self, face_id: Optional[int] = None):
        """Clears smoothing history."""
        if face_id is not None:
            self.smoothing_buffers.pop(face_id, None)
        else:
            self.smoothing_buffers.clear()
