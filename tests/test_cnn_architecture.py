import pytest
import numpy as np
from training.cnn_model import build_emotion_cnn
from backend.core.config import settings

def test_cnn_architecture_shapes():
    num_classes = len(settings.EMOTION_CLASSES)
    assert num_classes == 7, "FER-2013 must strictly have 7 original classes"

    model = build_emotion_cnn(input_shape=(48, 48, 1), num_classes=num_classes)
    
    assert model.input_shape == (None, 48, 48, 1)
    assert model.output_shape == (None, 7)

def test_cnn_forward_pass_probabilities():
    model = build_emotion_cnn(input_shape=(48, 48, 1), num_classes=7)
    
    # Generate dummy batch
    dummy_input = np.random.uniform(0.0, 1.0, size=(4, 48, 48, 1)).astype("float32")
    preds = model.predict(dummy_input)

    assert preds.shape == (4, 7)
    # Check that predictions are valid non-negative probabilities
    assert np.all(preds >= 0.0)
    assert np.all(preds <= 1.0)

    # Check that softmax probabilities sum to 1.0 per sample
    sums = np.sum(preds, axis=1)
    np.testing.assert_allclose(sums, np.ones(4), rtol=1e-5, atol=1e-5)
