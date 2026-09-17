import os
import datetime
from typing import Tuple, Optional
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from backend.app.database import engine, SessionLocal
from backend.app.models import ATMLocation, Complaint, MuleAccount, ATMRiskHistory
from backend.app.ml.features import compute_atm_features, FEATURE_COLUMNS
from backend.app.ml.model import ATMDefenseModel, run_predictions


def build_training_dataset(db: Session) -> Tuple[pd.DataFrame, np.ndarray]:
    """Extracts historical snapshots or computes realistic labeled dataset from DB."""
    atms = db.query(ATMLocation).all()
    if not atms:
        raise ValueError("No ATMs found in database. Run fetch_atms first.")

    # Compute feature matrix
    atm_ids, X = compute_atm_features(db)

    # Build target labels: 1 if high fraud risk / spike flag in district
    # Correlate strongly with velocity and cross-state mule presence
    y_prob = (
        0.35 * (X["district_fraud_density"] / (X["district_fraud_density"].max() + 1e-5)) +
        0.45 * (X["complaint_velocity_6h"] / (X["complaint_velocity_6h"].max() + 1e-5)) +
        0.20 * X["cross_state_flag"]
    )
    # Threshold to create positive labels
    y = (y_prob > np.percentile(y_prob, 75)).astype(int).to_numpy()

    # If dataset has multiple snapshots, expand
    return X, y


def train_and_evaluate(db: Session, model_save_path: Optional[str] = None) -> ATMDefenseModel:
    """Trains XGBoost model on DB data, evaluates, saves, and populates predictions."""
    X, y = build_training_dataset(db)

    model = ATMDefenseModel(model_path=model_save_path)
    metrics = model.train(X, y)
    print(f"Training complete. Metrics: ROC-AUC = {metrics['roc_auc']}, Precision@10 = {metrics['precision_at_10']}")

    model.save()

    print("Running initial predictions across all ATMs...")
    preds = run_predictions(db, model=model)
    print(f"Generated {len(preds)} ATM risk predictions.")

    return model


if __name__ == "__main__":
    db = SessionLocal()
    try:
        train_and_evaluate(db)
    finally:
        db.close()
