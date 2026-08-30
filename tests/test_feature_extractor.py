import pytest
from backend.services.feature_extractor import GeometricFeatureExtractor

def test_feature_extractor_bounding_box_only():
    extractor = GeometricFeatureExtractor()
    bbox = (50, 60, 100, 120)
    img_shape = (480, 640)

    features = extractor.extract_features(None, bbox, img_shape)
    assert features is not None
    assert features.face_width == 100.0
    assert features.face_height == 120.0
    assert features.face_aspect_ratio == 1.2

def test_feature_extractor_with_mock_landmarks():
    extractor = GeometricFeatureExtractor()
    bbox = (100, 100, 200, 200)
    img_shape = (480, 640)

    # 468 mock normalized landmarks
    mock_landmarks = [[0.5, 0.5] for _ in range(468)]
    # Set specific points
    mock_landmarks[extractor.LEFT_EYE_TOP] = [0.4, 0.35]
    mock_landmarks[extractor.LEFT_EYE_BOTTOM] = [0.4, 0.38]
    mock_landmarks[extractor.LEFT_EYE_OUTER] = [0.35, 0.36]
    mock_landmarks[extractor.LEFT_EYE_INNER] = [0.45, 0.36]

    mock_landmarks[extractor.MOUTH_TOP_LIP] = [0.5, 0.6]
    mock_landmarks[extractor.MOUTH_BOTTOM_LIP] = [0.5, 0.7]

    features = extractor.extract_features(mock_landmarks, bbox, img_shape)
    assert features is not None
    assert features.eye_openness_left is not None
    assert features.eye_openness_left > 0
    assert features.mouth_openness is not None
    assert features.mouth_openness > 0
