import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any, Optional
from backend.app.config import settings


def send_alert_email(
    district: str,
    state: str,
    severity: str,
    complaint_count: int,
    message: Optional[str] = None,
    recipients: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Sends alert notification email via SMTP.
    In testing/dev without valid SMTP credentials, logs cleanly and mocks without crashing.
    """
    if not recipients:
        recipients = [f"lea_{district.lower()}@police.gov.in", "analyst@i4c.gov.in"]

    subject = f"[{severity} ALERT] Cash-Out Hotspot Detected: {district}, {state}"
    body = f"""
===================================================================
TRACK THE CASH - I4C CYBERCRIME PREDICTIVE ANALYTICS ALERT
===================================================================

Severity: {severity}
Jurisdiction: {district}, {state}
Complaint Volume (Last 6h): {complaint_count}

Details:
{message or 'Statistically significant complaint velocity spike detected. Immediate field deployment and ATM monitoring recommended before cash withdrawal occurs.'}

Please access the LEA / Admin Dashboard for live geospatial ATM risk coordinates.
===================================================================
"""

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Mock mode when running without SMTP credentials
        print(f"[MOCK EMAIL DISPATCHED] To: {recipients} | Subject: {subject}")
        return {"status": "sent (mock)", "recipients": recipients, "subject": subject}

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.SMTP_FROM
        msg["To"] = ", ".join(recipients)
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, recipients, msg.as_string())

        return {"status": "sent", "recipients": recipients, "subject": subject}
    except Exception as e:
        print(f"[SMTP SEND ERROR] Failed to send email to {recipients}: {e}")
        # Return fallback status without crashing application
        return {"status": "failed", "error": str(e), "recipients": recipients}
