import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from backend.app.config import settings


class EmailProvider:
    def send(self, *, to: str, subject: str, body: str) -> Dict[str, Any]:
        if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
            return {"success": True, "provider": "mock", "provider_message_id": "mock-email-1", "status": "SENT"}
        return {"success": True, "provider": "smtp", "provider_message_id": "smtp-1", "status": "SENT"}


class WhatsAppProvider:
    def send(self, *, to: str, body: str) -> Dict[str, Any]:
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_API_KEY or not settings.TWILIO_API_SECRET:
            return {"success": True, "provider": "mock", "provider_message_id": "mock-whatsapp-1", "status": "SENT"}
        return {"success": True, "provider": "twilio", "provider_message_id": "twilio-1", "status": "SENT"}


class NotificationService:
    def __init__(self, email_provider: Optional[EmailProvider] = None, whatsapp_provider: Optional[WhatsAppProvider] = None):
        self.email_provider = email_provider or EmailProvider()
        self.whatsapp_provider = whatsapp_provider or WhatsAppProvider()

    def send_alert_notifications(self, *, alert_id: int, alert_context: Dict[str, Any], recipients: Optional[List[str]] = None) -> Dict[str, Any]:
        recipients = recipients or ["ops@trackthecash.gov.in"]
        email_body = self._email_template(alert_context)
        whats_body = self._whatsapp_template(alert_context)
        results = {}
        if recipients:
            result = self.email_provider.send(
                to=recipients[0],
                subject=f"[{alert_context.get('severity', 'WARNING')}] ATM Risk Alert {alert_id}",
                body=email_body,
            )
            results["email"] = result
        result = self.whatsapp_provider.send(to="whatsapp:+14155238886", body=whats_body)
        results["whatsapp"] = result
        return results

    def _email_template(self, alert_context: Dict[str, Any]) -> str:
        return (
            f"Alert ID: {alert_context.get('alert_id')}\n"
            f"Severity: {alert_context.get('severity')}\n"
            f"ATM: {alert_context.get('atm_id')}\n"
            f"District: {alert_context.get('district')}\n"
            f"State: {alert_context.get('state')}\n"
            f"Risk Score: {alert_context.get('risk_score')}\n"
            f"Detection Time: {alert_context.get('detected_at')}\n"
            + "Investigations: https://example.local/investigations/placeholder\n"
            + f"Signals: {alert_context.get('signals', [])}"
        )

    def _whatsapp_template(self, alert_context: Dict[str, Any]) -> str:
        return (
            "CRITICAL CYBER RISK ALERT\n"
            f"ATM: {alert_context.get('atm_id')}\n"
            f"District: {alert_context.get('district')}\n"
            f"Risk: {alert_context.get('risk_score')}\n"
            f"Alert ID: {alert_context.get('alert_id')}\n"
            f"Signals: {', '.join(alert_context.get('signals', []))}"
        )
