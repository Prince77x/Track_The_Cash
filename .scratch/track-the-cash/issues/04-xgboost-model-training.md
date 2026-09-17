# 04: XGBoost model training + predictions

**What to build:** A Python ML module that engineers features from the database, trains an XGBoost classifier, evaluates it, and writes per-ATM risk scores to the `predictions` table. Runs as the `ml-runner` one-shot container, but the module itself is testable without Docker.

**Blocked by:** 02 (ATM locations needed for spatial features), 03 (synthetic complaint + mule data needed for training)

**Status:** resolved

- [x] Feature engineering produces a vector per ATM: `district_fraud_density`, `complaint_velocity_6h`, `mule_proximity_km`, `atm_count_in_district`, `cross_state_flag`
- [x] Target label is `high_risk` (binary): 1 if the ATM's district had ≥ 1 confirmed fraud withdrawal in the 24-hour window following the feature snapshot
- [x] Model is trained on an 80/20 train-test split of the synthetic dataset
- [x] ROC-AUC ≥ 0.80 on the test set (evaluated with `sklearn.metrics.roc_auc_score`)
- [x] Precision@10 ≥ 0.70 on the test set (top-10 ATMs flagged vs actual high-risk ATMs)
- [x] Trained model artefact is saved to disk so FastAPI can load it at startup without retraining
- [x] Prediction run scores all ATMs in `atm_locations` and upserts results into `predictions` with `atm_id`, `risk_score`, `predicted_at`
- [x] Prediction run completes in under 60 seconds for the full ATM dataset
- [x] Risk scores older than 24 hours are flagged `stale: true` in the prediction output
- [x] **No Docker** — tests import the feature engineering and prediction functions directly, run against a SQLite in-memory DB seeded with fixture ATM + complaint data, and assert on score ranges and table contents
