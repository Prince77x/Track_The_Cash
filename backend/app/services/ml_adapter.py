from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict


class BaseRiskModel(ABC):
    @abstractmethod
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


class MockRiskModel(BaseRiskModel):
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        complaint_count = float(features.get("complaint_count_24h", 0))
        cross_state = 1 if features.get("cross_state_count", 0) > 0 else 0
        withdrawals = float(features.get("withdrawal_count_24h", 0))
        historical = float(features.get("historical_risk", 0.0))
        spike_ratio = float(features.get("spike_ratio", 1.0))

        risk = min(99.9, 30 + complaint_count * 12 + withdrawals * 6 + historical * 25 + cross_state * 15 + (spike_ratio - 1) * 25)
        risk = max(5.0, risk)
        confidence = min(0.99, max(0.5, 0.55 + (risk / 100) * 0.4))
        return {
            "risk_score": round(risk, 2),
            "confidence": round(confidence, 4),
            "model_version": "mock-v1.0",
        }


class TrainedModelAdapter(BaseRiskModel):
    def __init__(self, model: Any | None = None):
        self.model = model

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        if self.model is None:
            return MockRiskModel().predict(features)
        payload = self.model.predict(features)
        return payload
