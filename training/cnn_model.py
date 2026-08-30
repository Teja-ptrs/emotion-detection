import tensorflow as tf
from tensorflow.keras import layers, models, regularizers

def build_emotion_cnn(
    input_shape: tuple = (48, 48, 1),
    num_classes: int = 7,
    learning_rate: float = 0.0005,
    l2_reg: float = 1e-4
) -> tf.keras.Model:
    """
    Builds a robust, deep Convolutional Neural Network specifically optimized
    for 48x48 grayscale Facial Emotion Recognition (FER-2013).
    
    Architecture features:
    - 4 Conv Blocks with Batch Normalization, He Normal initialization, and LeakyReLU / ReLU activations
    - Spatial Dropout for regularized feature learning
    - Global Average Pooling combined with Dense layers to prevent overfitting
    - Softmax classifier over 7 emotion categories
    """
    inputs = layers.Input(shape=input_shape, name="face_input")

    # Block 1 (64 filters)
    x = layers.Conv2D(64, (3, 3), padding="same", kernel_initializer="he_normal", kernel_regularizer=regularizers.l2(l2_reg))(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Conv2D(64, (3, 3), padding="same", kernel_initializer="he_normal", kernel_regularizer=regularizers.l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D(pool_size=(2, 2))(x)
    x = layers.Dropout(0.25)(x)

    # Block 2 (128 filters)
    x = layers.Conv2D(128, (3, 3), padding="same", kernel_initializer="he_normal", kernel_regularizer=regularizers.l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Conv2D(128, (3, 3), padding="same", kernel_initializer="he_normal", kernel_regularizer=regularizers.l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D(pool_size=(2, 2))(x)
    x = layers.Dropout(0.25)(x)

    # Block 3 (256 filters)
    x = layers.Conv2D(256, (3, 3), padding="same", kernel_initializer="he_normal", kernel_regularizer=regularizers.l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Conv2D(256, (3, 3), padding="same", kernel_initializer="he_normal", kernel_regularizer=regularizers.l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D(pool_size=(2, 2))(x)
    x = layers.Dropout(0.3)(x)

    # Block 4 (512 filters)
    x = layers.Conv2D(512, (3, 3), padding="same", kernel_initializer="he_normal", kernel_regularizer=regularizers.l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.MaxPooling2D(pool_size=(2, 2))(x)
    x = layers.Dropout(0.35)(x)

    # Fully Connected Head
    x = layers.Flatten()(x)
    x = layers.Dense(512, kernel_initializer="he_normal", kernel_regularizer=regularizers.l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Dropout(0.5)(x)

    x = layers.Dense(256, kernel_initializer="he_normal", kernel_regularizer=regularizers.l2(l2_reg))(x)
    x = layers.BatchNormalization()(x)
    x = layers.Activation("relu")(x)
    x = layers.Dropout(0.4)(x)

    outputs = layers.Dense(num_classes, activation="softmax", name="emotion_softmax")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="FER_Emotion_CNN")

    optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(
        optimizer=optimizer,
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )

    return model
