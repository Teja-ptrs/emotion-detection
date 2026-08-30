import os
import sys

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import pandas as pd
from typing import Tuple, Optional, Dict
from backend.core.config import settings

def load_fer2013_csv(
    csv_path: str = "data/fer2013.csv"
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Loads and parses the official FER-2013 CSV dataset.
    Columns expected: 'emotion', 'pixels', 'Usage' ('Training', 'PublicTest', 'PrivateTest')
    
    Returns:
        (X_train, y_train), (X_val, y_val), (X_test, y_test)
        with images shaped as (N, 48, 48, 1) in float32 [0.0, 1.0].
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(
            f"FER-2013 dataset not found at '{csv_path}'. "
            f"Please download fer2013.csv from Kaggle (https://www.kaggle.com/c/challenges-in-representation-learning-facial-expression-recognition-challenge) "
            f"and place it into the 'data/' folder."
        )

    print(f"[Dataset] Loading FER-2013 dataset from {csv_path}...")
    df = pd.read_csv(csv_path)

    print(f"[Dataset] Total records in CSV: {len(df)}")
    print("[Dataset] Class distribution in dataset:")
    emotion_counts = df['emotion'].value_counts().sort_index()
    for idx, count in emotion_counts.items():
        name = settings.EMOTION_CLASSES[idx] if idx < len(settings.EMOTION_CLASSES) else f"Class_{idx}"
        print(f"  - [{idx}] {name}: {count} samples ({count/len(df)*100:.1f}%)")

    # Parse pixel values
    def parse_pixels(pixels_str):
        return np.array([int(p) for p in pixels_str.split()], dtype="float32").reshape(48, 48, 1)

    train_df = df[df["Usage"] == "Training"]
    val_df = df[df["Usage"] == "PublicTest"]
    test_df = df[df["Usage"] == "PrivateTest"]

    # Fallback if Usage column is not partitioned
    if len(train_df) == 0:
        from sklearn.model_selection import train_test_split
        train_val_df, test_df = train_test_split(df, test_size=0.15, random_state=42, stratify=df['emotion'])
        train_df, val_df = train_test_split(train_val_df, test_size=0.15, random_state=42, stratify=train_val_df['emotion'])

    print(f"[Dataset] Splitting: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")

    print("[Dataset] Parsing training images...")
    X_train = np.stack(train_df["pixels"].apply(parse_pixels).values) / 255.0
    y_train = train_df["emotion"].values.astype("int32")

    print("[Dataset] Parsing validation images...")
    X_val = np.stack(val_df["pixels"].apply(parse_pixels).values) / 255.0
    y_val = val_df["emotion"].values.astype("int32")

    print("[Dataset] Parsing test images...")
    X_test = np.stack(test_df["pixels"].apply(parse_pixels).values) / 255.0
    y_test = test_df["emotion"].values.astype("int32")

    return (X_train, y_train), (X_val, y_val), (X_test, y_test)

def load_directory_dataset(
    data_dir: str = "data"
) -> Optional[Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]]:
    """
    Loads FER-2013 from directory format: data/train/{emotion}/... and data/test/{emotion}/...
    """
    import cv2
    train_dir = os.path.join(data_dir, "train")
    test_dir = os.path.join(data_dir, "test")

    if not (os.path.exists(train_dir) and os.path.exists(test_dir)):
        return None

    print(f"[Dataset] Loading image directory dataset from {data_dir}...")
    classes = settings.EMOTION_CLASSES

    def load_split(split_dir):
        images, labels = [], []
        for class_idx, class_name in enumerate(classes):
            class_folder = os.path.join(split_dir, class_name.lower())
            if not os.path.exists(class_folder):
                class_folder = os.path.join(split_dir, class_name)
            if not os.path.exists(class_folder):
                continue

            for fname in os.listdir(class_folder):
                fpath = os.path.join(class_folder, fname)
                if fname.lower().endswith((".png", ".jpg", ".jpeg")):
                    img = cv2.imread(fpath, cv2.IMREAD_GRAYSCALE)
                    if img is not None:
                        if img.shape != (48, 48):
                            img = cv2.resize(img, (48, 48))
                        images.append(img)
                        labels.append(class_idx)

        return np.array(images, dtype="float32").reshape(-1, 48, 48, 1) / 255.0, np.array(labels, dtype="int32")

    X_train_full, y_train_full = load_split(train_dir)
    X_test, y_test = load_split(test_dir)

    from sklearn.model_selection import train_test_split
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_full, y_train_full, test_size=0.15, random_state=42, stratify=y_train_full
    )

    return (X_train, y_train), (X_val, y_val), (X_test, y_test)
