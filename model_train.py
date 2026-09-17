#---------------------- Data Fetching and Preprocessing ----------------------#
import pandas as pd
import numpy as np

df = pd.read_csv("/kaggle/input/datasets/shubham3421/atm-fraud/training_data_corrected.csv")

df["prediction_time"] = pd.to_datetime(
    df["prediction_time"]
)

print("Shape:", df.shape)

display(df.head())

print("\nColumns:")
print(df.columns.tolist())

print("\nTarget distribution:")
print(df["target"].value_counts())

print("\nTarget percentage:")
print(
    df["target"]
    .value_counts(normalize=True)
    .mul(100)
)



FEATURES = [
    "district_fraud_density",
    "complaint_velocity_6h",
    "mule_proximity_km",
    "atm_count_district",
    "cross_state_flag"
]

TARGET = "target"

X = df[FEATURES]
y = df[TARGET]

print("Features:")
print(FEATURES)

print("\nX shape:", X.shape)
print("y shape:", y.shape)


X = X.replace(
    [np.inf, -np.inf],
    np.nan
)

X = X.fillna(0)

#----------------------- Train-Test Split -----------------------#
# ============================================================
# TIME-BASED 80/20 SPLIT
# ============================================================

times = np.sort(
    df["prediction_time"].unique()
)

split_index = int(
    len(times) * 0.80
)

train_times = times[:split_index]
test_times = times[split_index:]

train_df = df[
    df["prediction_time"].isin(train_times)
].copy()

test_df = df[
    df["prediction_time"].isin(test_times)
].copy()

print("Total prediction windows:", len(times))

print("Training windows:", len(train_times))
print("Testing windows:", len(test_times))

print("\nTraining rows:", len(train_df))
print("Testing rows:", len(test_df))

print(
    "\nTrain period:",
    train_df["prediction_time"].min(),
    "→",
    train_df["prediction_time"].max()
)

print(
    "Test period:",
    test_df["prediction_time"].min(),
    "→",
    test_df["prediction_time"].max()
)
X_train = train_df[FEATURES]
y_train = train_df[TARGET]

X_test = test_df[FEATURES]
y_test = test_df[TARGET]

print("X_train:", X_train.shape)
print("y_train:", y_train.shape)

print("X_test:", X_test.shape)
print("y_test:", y_test.shape)
print("TRAIN")

print(
    y_train.value_counts()
)

print(
    y_train.value_counts(normalize=True)
)

print("\nTEST")

print(
    y_test.value_counts()
)

print(
    y_test.value_counts(normalize=True)
)












#-----------------------MODEL TRAINING-----------------------#
from xgboost import XGBClassifier

# Calculate class imbalance weight
negative_count = (y_train == 0).sum()
positive_count = (y_train == 1).sum()

scale_pos_weight = (
    negative_count / positive_count
)

print(
    "scale_pos_weight:",
    scale_pos_weight
)

model = XGBClassifier(

    n_estimators=5000,

    learning_rate=0.03,

    max_depth=8,

    min_child_weight=5,

    subsample=0.80,

    colsample_bytree=0.90,

    gamma=0.10,

    reg_alpha=2.0,

    reg_lambda=3.0,

    objective="binary:logistic",

    eval_metric="auc",

    scale_pos_weight=scale_pos_weight,

    random_state=42,

    n_jobs=-1
)

model.fit(
    X_train,
    y_train,

    eval_set=[
        (X_train, y_train),
        (X_test, y_test)
    ],

    verbose=False
)

print("XGBoost training completed.")


#Just For testing the model on the test set and getting predictions

test_probability = model.predict_proba(
    X_test
)[:, 1]

test_prediction = (
    test_probability >= 0.5
).astype(int)


#-----------------------MODEL EVALUATION-----------------------#
from sklearn.metrics import (
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    accuracy_score,
    classification_report
)

roc_auc = roc_auc_score(
    y_test,
    test_probability
)

print(
    f"ROC-AUC: {roc_auc:.4f}"
)


precision = precision_score(
    y_test,
    test_prediction,
    zero_division=0
)

recall = recall_score(
    y_test,
    test_prediction,
    zero_division=0
)

f1 = f1_score(
    y_test,
    test_prediction,
    zero_division=0
)

accuracy = accuracy_score(
    y_test,
    test_prediction
)

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1       : {f1:.4f}")
print(f"ROC-AUC  : {roc_auc:.4f}")


def precision_at_k(
    dataframe,
    probabilities,
    k=10
):

    temp = dataframe[
        [
            "prediction_time",
            "atm_id",
            "target"
        ]
    ].copy()

    temp["risk_score"] = probabilities

    scores = []

    for prediction_time, group in temp.groupby(
        "prediction_time"
    ):

        top_k = (
            group
            .sort_values(
                "risk_score",
                ascending=False
            )
            .head(k)
        )

        precision = top_k["target"].mean()

        scores.append({
            "prediction_time": prediction_time,
            "precision_at_k": precision
        })

    result = pd.DataFrame(scores)

    return result


p10_results = precision_at_k(
    test_df,
    test_probability,
    k=10
)

print(p10_results.head(10))

precision_at_10 = (
    p10_results["precision_at_k"]
    .mean()
)

print(
    f"\nPrecision@10: {precision_at_10:.4f}"
)

p10_results["positive_count_top10"] = (
    p10_results["precision_at_k"] * 10
)

print(
    p10_results[
        [
            "prediction_time",
            "positive_count_top10",
            "precision_at_k"
        ]
    ].head(20)
)

#----------------------Feature Importance----------------------#
importance = pd.DataFrame({
    "feature": FEATURES,
    "importance": model.feature_importances_
})

importance = importance.sort_values(
    "importance",
    ascending=False
)

display(importance)