import os
import sys
import json
import argparse

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
import tensorflow as tf
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau, CSVLogger
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

from backend.core.config import settings
from training.cnn_model import build_emotion_cnn
from training.dataset import load_fer2013_csv, load_directory_dataset
from training.preprocessing import get_data_generators

def train_emotion_model(
    data_path: str = "data/fer2013.csv",
    output_model_path: str = "models/emotion_model.keras",
    epochs: int = 50,
    batch_size: int = 64,
    learning_rate: float = 0.0005
):
    """
    Executes the full end-to-end training pipeline on FER-2013.
    """
    os.makedirs(os.path.dirname(output_model_path), exist_ok=True)
    os.makedirs("training", exist_ok=True)

    print("=" * 60)
    print("AI Emotion Recognition - CNN Training Pipeline")
    print(f"Dataset path: {data_path}")
    print(f"Output model path: {output_model_path}")
    print(f"Target epochs: {epochs}, Batch size: {batch_size}, LR: {learning_rate}")
    print("=" * 60)

    # 1. Load Dataset
    data_loaded = False
    if os.path.exists(data_path) and data_path.endswith(".csv"):
        (X_train, y_train), (X_val, y_val), (X_test, y_test) = load_fer2013_csv(data_path)
        data_loaded = True
    elif os.path.isdir(data_path):
        dir_res = load_directory_dataset(data_path)
        if dir_res is not None:
            (X_train, y_train), (X_val, y_val), (X_test, y_test) = dir_res
            data_loaded = True

    if not data_loaded:
        print(f"\n[ERROR] Dataset not found at '{data_path}'.")
        print("Please place 'fer2013.csv' into 'data/' or provide a path via --data.")
        return

    print(f"\n[INFO] Data shapes:")
    print(f"  Train: X={X_train.shape}, y={y_train.shape}")
    print(f"  Val:   X={X_val.shape}, y={y_val.shape}")
    print(f"  Test:  X={X_test.shape}, y={y_test.shape}")

    # 2. Setup Data Augmentation
    train_datagen, val_datagen = get_data_generators(batch_size=batch_size)
    train_generator = train_datagen.flow(X_train, y_train, batch_size=batch_size)
    val_generator = val_datagen.flow(X_val, y_val, batch_size=batch_size)

    # 3. Build CNN Architecture
    model = build_emotion_cnn(
        input_shape=(48, 48, 1),
        num_classes=len(settings.EMOTION_CLASSES),
        learning_rate=learning_rate
    )
    model.summary()

    # 4. Define Callbacks
    callbacks = [
        ModelCheckpoint(
            filepath=output_model_path,
            monitor="val_accuracy",
            save_best_only=True,
            mode="max",
            verbose=1
        ),
        EarlyStopping(
            monitor="val_loss",
            patience=10,
            restore_best_weights=True,
            mode="min",
            verbose=1
        ),
        ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.5,
            patience=4,
            min_lr=1e-6,
            verbose=1
        ),
        CSVLogger("training/training_log.csv")
    ]

    # 5. Train Model
    print("\n[INFO] Commencing training...")
    history = model.fit(
        train_generator,
        steps_per_epoch=len(X_train) // batch_size,
        epochs=epochs,
        validation_data=val_generator,
        validation_steps=len(X_val) // batch_size,
        callbacks=callbacks
    )

    # Save final model
    final_model_path = output_model_path.replace(".keras", "_final.keras")
    model.save(final_model_path)
    print(f"[INFO] Final model saved to: {final_model_path}")

    # Save training history
    history_dict = {
        "loss": [float(x) for x in history.history["loss"]],
        "accuracy": [float(x) for x in history.history["accuracy"]],
        "val_loss": [float(x) for x in history.history["val_loss"]],
        "val_accuracy": [float(x) for x in history.history["val_accuracy"]],
        "lr": [float(x) for x in history.history.get("lr", [])]
    }
    with open("training/training_history.json", "w") as f:
        json.dump(history_dict, f, indent=2)
    print("[INFO] Training history saved to: training/training_history.json")

    # 6. Evaluate on Unseen Test Set
    print("\n" + "=" * 60)
    print("EVALUATING MODEL ON UNSEEN TEST DATASET")
    print("=" * 60)
    
    # Load best checkpoint
    if os.path.exists(output_model_path):
        best_model = tf.keras.models.load_model(output_model_path)
    else:
        best_model = model

    test_loss, test_acc = best_model.evaluate(X_test, y_test, verbose=1)
    print(f"\n[RESULTS] Test Loss: {test_loss:.4f} | Test Accuracy: {test_acc * 100:.2f}%\n")

    # Softmax probabilities and predictions
    y_pred_probs = best_model.predict(X_test)
    y_pred = np.argmax(y_pred_probs, axis=1)

    # Classification Metrics
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="weighted")
    print(f"Weighted Precision : {precision:.4f}")
    print(f"Weighted Recall    : {recall:.4f}")
    print(f"Weighted F1 Score  : {f1:.4f}")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=settings.EMOTION_CLASSES))

    cm = confusion_matrix(y_test, y_pred)
    print("Confusion Matrix:")
    print(cm)

    # Save metrics summary
    metrics_summary = {
        "test_loss": float(test_loss),
        "test_accuracy": float(test_acc),
        "weighted_precision": float(precision),
        "weighted_recall": float(recall),
        "weighted_f1_score": float(f1),
        "classes": settings.EMOTION_CLASSES,
        "confusion_matrix": cm.tolist()
    }
    with open("training/evaluation_metrics.json", "w") as f:
        json.dump(metrics_summary, f, indent=2)

    print("\n[SUCCESS] Training and evaluation pipeline complete.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train CNN model on FER-2013 dataset")
    parser.add_argument("--data", type=str, default="data/fer2013.csv", help="Path to fer2013.csv or dataset dir")
    parser.add_argument("--output", type=str, default="models/emotion_model.keras", help="Path to save trained model")
    parser.add_argument("--epochs", type=int, default=50, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.0005, help="Initial learning rate")

    args = parser.parse_args()
    train_emotion_model(
        data_path=args.data,
        output_model_path=args.output,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr
    )
