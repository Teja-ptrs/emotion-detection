import numpy as np
from typing import List, Tuple, Dict
from scipy.spatial import distance as dist
from collections import OrderedDict

class TrackedFace:
    def __init__(self, face_id: int, bbox: Tuple[int, int, int, int]):
        self.face_id = face_id
        self.face_identifier = f"Face {face_id}"
        self.bbox = bbox
        self.centroid = self._compute_centroid(bbox)
        self.disappeared_count = 0
        self.total_frames = 1

    def _compute_centroid(self, bbox: Tuple[int, int, int, int]) -> Tuple[int, int]:
        x, y, w, h = bbox
        return (int(x + w / 2.0), int(y + h / 2.0))

    def update(self, bbox: Tuple[int, int, int, int]):
        self.bbox = bbox
        self.centroid = self._compute_centroid(bbox)
        self.disappeared_count = 0
        self.total_frames += 1

def compute_iou(boxA: Tuple[int, int, int, int], boxB: Tuple[int, int, int, int]) -> float:
    # box = (x, y, w, h) -> convert to (x1, y1, x2, y2)
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

    inter_width = max(0, xB - xA)
    inter_height = max(0, yB - yA)
    inter_area = inter_width * inter_height

    boxA_area = boxA[2] * boxA[3]
    boxB_area = boxB[2] * boxB[3]
    union_area = float(boxA_area + boxB_area - inter_area)

    if union_area == 0:
        return 0.0
    return inter_area / union_area

class FaceTracker:
    """
    Centroid + IoU multi-face tracker.
    Maintains persistent Face IDs across frames and handles disappearing faces.
    """
    def __init__(self, max_disappeared: int = 15, iou_threshold: float = 0.3):
        self.next_face_id = 1
        self.tracked_faces: Dict[int, TrackedFace] = OrderedDict()
        self.max_disappeared = max_disappeared
        self.iou_threshold = iou_threshold

    def register(self, bbox: Tuple[int, int, int, int]) -> TrackedFace:
        tracked = TrackedFace(self.next_face_id, bbox)
        self.tracked_faces[self.next_face_id] = tracked
        self.next_face_id += 1
        return tracked

    def deregister(self, face_id: int):
        if face_id in self.tracked_faces:
            del self.tracked_faces[face_id]

    def reset(self):
        self.tracked_faces.clear()
        self.next_face_id = 1

    def update(self, detected_bboxes: List[Tuple[int, int, int, int]]) -> List[Tuple[int, str, Tuple[int, int, int, int]]]:
        """
        Updates tracked faces with newly detected bounding boxes.
        Returns list of (face_id, face_identifier, (x, y, w, h)).
        """
        # If no bounding boxes are detected in this frame
        if len(detected_bboxes) == 0:
            for face_id in list(self.tracked_faces.keys()):
                self.tracked_faces[face_id].disappeared_count += 1
                if self.tracked_faces[face_id].disappeared_count > self.max_disappeared:
                    self.deregister(face_id)
            return []

        # If we currently have no tracked faces, register all new detections
        if len(self.tracked_faces) == 0:
            results = []
            for bbox in detected_bboxes:
                tracked = self.register(bbox)
                results.append((tracked.face_id, tracked.face_identifier, tracked.bbox))
            return results

        # Pair existing tracked faces with new detections using IoU and Centroid distance
        face_ids = list(self.tracked_faces.keys())
        tracked_centroids = [self.tracked_faces[fid].centroid for fid in face_ids]
        
        new_centroids = [
            (int(bbox[0] + bbox[2] / 2.0), int(bbox[1] + bbox[3] / 2.0))
            for bbox in detected_bboxes
        ]

        # Distance matrix between tracked centroids and new centroids
        D = dist.cdist(np.array(tracked_centroids), np.array(new_centroids))

        # Sort matches by smallest distance
        rows = D.min(axis=1).argsort()
        cols = D.argmin(axis=1)[rows]

        used_rows = set()
        used_cols = set()

        for (row, col) in zip(rows, cols):
            if row in used_rows or col in used_cols:
                continue

            fid = face_ids[row]
            tracked_bbox = self.tracked_faces[fid].bbox
            new_bbox = detected_bboxes[col]

            # Check IoU or centroid proximity
            iou = compute_iou(tracked_bbox, new_bbox)
            centroid_distance = D[row, col]
            
            # Allow match if IoU is adequate OR distance is small relative to face size
            max_dim = max(tracked_bbox[2], tracked_bbox[3])
            if iou >= self.iou_threshold or centroid_distance < (max_dim * 0.75):
                self.tracked_faces[fid].update(new_bbox)
                used_rows.add(row)
                used_cols.add(col)

        # Process unused rows (disappeared tracked faces)
        unused_rows = set(range(0, D.shape[0])).difference(used_rows)
        for row in unused_rows:
            fid = face_ids[row]
            self.tracked_faces[fid].disappeared_count += 1
            if self.tracked_faces[fid].disappeared_count > self.max_disappeared:
                self.deregister(fid)

        # Process unused columns (new faces to register)
        unused_cols = set(range(0, D.shape[1])).difference(used_cols)
        for col in unused_cols:
            self.register(detected_bboxes[col])

        # Return currently active tracked faces matching the detections
        active_results = []
        for bbox in detected_bboxes:
            # Find the best matched face_id
            best_fid = None
            best_iou = -1.0
            for fid, tracked in self.tracked_faces.items():
                if tracked.disappeared_count == 0:
                    iou = compute_iou(tracked.bbox, bbox)
                    if iou > best_iou:
                        best_iou = iou
                        best_fid = fid
            if best_fid is not None:
                active_results.append((best_fid, self.tracked_faces[best_fid].face_identifier, bbox))
            else:
                # Fallback registration
                tracked = self.register(bbox)
                active_results.append((tracked.face_id, tracked.face_identifier, tracked.bbox))

        return active_results
