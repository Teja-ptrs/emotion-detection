import pytest
import numpy as np
import cv2
from backend.services.face_detector import FaceDetector
from backend.services.face_tracker import FaceTracker, compute_iou

def test_face_detector_bounds():
    detector = FaceDetector()
    
    # Blank black image
    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    bboxes = detector.detect_faces(blank)
    assert isinstance(bboxes, list)

    # Synthetic image with white rectangle (simulated face region)
    test_img = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.circle(test_img, (320, 240), 60, (255, 255, 255), -1)
    
    bboxes = detector.detect_faces(test_img)
    for (x, y, w, h) in bboxes:
        assert x >= 0 and y >= 0
        assert x + w <= 640
        assert y + h <= 480

def test_face_tracker_id_persistence():
    tracker = FaceTracker(max_disappeared=5, iou_threshold=0.3)
    
    # Frame 1: One face detected
    f1_boxes = [(100, 100, 80, 80)]
    tracked_f1 = tracker.update(f1_boxes)
    assert len(tracked_f1) == 1
    fid_1, name_1, bbox_1 = tracked_f1[0]
    assert fid_1 == 1
    assert name_1 == "Face 1"

    # Frame 2: Same face slightly shifted (movement)
    f2_boxes = [(105, 102, 80, 80)]
    tracked_f2 = tracker.update(f2_boxes)
    assert len(tracked_f2) == 1
    fid_2, name_2, bbox_2 = tracked_f2[0]
    assert fid_2 == 1, "Face ID must persist across consecutive frames"
    assert name_2 == "Face 1"

    # Frame 3: A second face appears
    f3_boxes = [(105, 102, 80, 80), (350, 200, 90, 90)]
    tracked_f3 = tracker.update(f3_boxes)
    assert len(tracked_f3) == 2
    fids = [f[0] for f in tracked_f3]
    assert 1 in fids
    assert 2 in fids

def test_iou_calculation():
    boxA = (0, 0, 50, 50)
    boxB = (0, 0, 50, 50)
    assert compute_iou(boxA, boxB) == 1.0

    boxC = (100, 100, 50, 50)
    assert compute_iou(boxA, boxC) == 0.0
