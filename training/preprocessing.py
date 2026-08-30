import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator

def get_data_generators(batch_size: int = 64):
    """
    Creates robust training and validation ImageDataGenerators for 48x48 emotion images.
    """
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255.0,
        rotation_range=15,
        width_shift_range=0.15,
        height_shift_range=0.15,
        shear_range=0.15,
        zoom_range=0.15,
        horizontal_flip=True,
        fill_mode="nearest"
    )

    val_datagen = ImageDataGenerator(
        rescale=1.0 / 255.0
    )

    return train_datagen, val_datagen

def normalize_pixels(pixels: np.ndarray) -> np.ndarray:
    """
    Normalizes pixel intensities to float32 range [0.0, 1.0].
    """
    if pixels.dtype != np.float32:
        pixels = pixels.astype("float32")
    if pixels.max() > 1.0:
        pixels = pixels / 255.0
    return pixels
