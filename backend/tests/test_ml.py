import os
import tempfile
import numpy as np
import pandas as pd
from backend.scripts.fetch_atms import ingest_atms
from backend.scripts.generate import generate_mule_accounts, generate_batch_complaints
from backend.app.ml.features import compute_atm_features, FEATURE_COLUMNS
from backend.app.ml.model import ATMDefenseModel, run_predictions
from backend.app.models import Prediction


def test_feature_engineering_shape(db_session):
    ingest_atms(db_session, target_count=50)
    mules = generate_mule_accounts(db_session, num_mules=50)
    generate_batch_complaints(db_session, days=3, complaints_per_day=100, mule_ids=mules)

    atm_ids, X = compute_atm_features(db_session)
    assert len(atm_ids) >= 50
    assert list(X.columns) == FEATURE_COLUMNS
    assert len(X) == len(atm_ids)


def test_model_training_and_metrics(db_session):
    ingest_atms(db_session, target_count=60)
    mules = generate_mule_accounts(db_session, num_mules=60)
    generate_batch_complaints(db_session, days=4, complaints_per_day=200, mule_ids=mules)

    atm_ids, X = compute_atm_features(db_session)

    # Synthetic signal target
    y_prob = (
        0.35 * (X["district_fraud_density"] / (X["district_fraud_density"].max() + 1e-5)) +
        0.45 * (X["complaint_velocity_6h"] / (X["complaint_velocity_6h"].max() + 1e-5)) +
        0.20 * X["cross_state_flag"]
    )
    y = (y_prob > np.percentile(y_prob, 70)).astype(int).to_numpy()

    with tempfile.TemporaryDirectory() as tmpdir:
        model_path = os.path.join(tmpdir, "model.joblib")
        model = ATMDefenseModel(model_path=model_path)
        metrics = model.train(X, y)

        assert metrics["roc_auc"] >= 0.80
        assert metrics["precision_at_10"] >= 0.70

        # Test save & load
        model.save()
        assert os.path.exists(model_path)

        loaded_model = ATMDefenseModel(model_path=model_path)
        assert loaded_model.load() is True
        assert loaded_model.metadata["roc_auc"] == metrics["roc_auc"]

        # Run predictions into DB
        preds = run_predictions(db_session, model=loaded_model)
        assert len(preds) == len(atm_ids)

        db_preds = db_session.query(Prediction).all()
        assert len(db_preds) == len(atm_ids)
        for p in db_preds:
            assert 0.0 <= p.risk_score <= 1.0
            assert p.predicted_at is not None
