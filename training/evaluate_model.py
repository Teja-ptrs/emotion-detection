import os
import sys
import json
import argparse

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

from backend.core.config import settings
from training.dataset import load_fer2013_csv, load_directory_dataset

def evaluate_model_pipeline(
    model_path: str = "models/emotion_model.keras",
    data_path: str = "data/fer2013.csv"
):
    """
    Evaluates a trained model checkpoint on the test partition of FER-2013.
    """
    if not os.path.exists(model_path):
        print(f"[ERROR] Model file not found at '{model_path}'.")
        print("Please train the model first using: python training/train_model.py")
        return

    print(f"[INFO] Loading model from {model_path}...")
    model = tf.keras.models.load_model(model_path)

    # Load test split
    if os.path.exists(data_path) and data_path.endswith(".csv"):
        _, _, (X_test, y_test) = load_fer2013_csv(data_path)
    elif os.path.isdir(data_path):
        res = load_directory_dataset(data_path)
        if res is None:
            print(f"[ERROR] Dataset directory invalid: {data_path}")
            return
        _, _, (X_test, y_test) = res
    else:
        print(f"[ERROR] Dataset not found at {data_path}")
        return

    print(f"[INFO] Evaluating on {len(X_test)} unseen test samples...")
    # Scale X_test to match the model's exact training scale
    X_test_scaled = X_test / 255.0
    test_loss, test_acc = model.evaluate(X_test_scaled, y_test, verbose=1)

    y_pred_probs = model.predict(X_test_scaled)
    y_pred = np.argmax(y_pred_probs, axis=1)

    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    cm = confusion_matrix(y_test, y_pred)

    print("\n" + "=" * 60)
    print("DETAILED PERFORMANCE EVALUATION REPORT")
    print("=" * 60)
    print(f"Test Loss        : {test_loss:.4f}")
    print(f"Test Accuracy    : {test_acc * 100:.2f}%")
    print(f"Weighted Precision: {precision:.4f}")
    print(f"Weighted Recall   : {recall:.4f}")
    print(f"Weighted F1-Score : {f1:.4f}")
    print("=" * 60)

    print("\nPer-Class Classification Report:")
    report_dict = classification_report(y_test, y_pred, target_names=settings.EMOTION_CLASSES, output_dict=True)
    print(classification_report(y_test, y_pred, target_names=settings.EMOTION_CLASSES))

    print("\nConfusion Matrix:")
    print(cm)

    # Save to disk
    eval_result = {
        "model_path": model_path,
        "test_loss": float(test_loss),
        "test_accuracy": float(test_acc),
        "weighted_precision": float(precision),
        "weighted_recall": float(recall),
        "weighted_f1_score": float(f1),
        "classification_report": report_dict,
        "confusion_matrix": cm.tolist()
    }
    with open("training/evaluation_report.json", "w") as f:
        json.dump(eval_result, f, indent=2)
    print("\n[SUCCESS] Evaluation report saved to training/evaluation_report.json")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Emotion CNN Model")
    parser.add_argument("--model", type=str, default="models/emotion_model.keras", help="Path to trained model")
    parser.add_argument("--data", type=str, default="data/fer2013.csv", help="Path to FER-2013 dataset")
    args = parser.parse_args()

    evaluate_model_pipeline(model_path=args.model, data_path=args.data)
