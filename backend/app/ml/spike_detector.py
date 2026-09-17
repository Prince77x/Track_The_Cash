import datetime
from typing import List, Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models import Complaint, Alert, MuleAccount, ATMLocation, utc_now
from backend.app.email_service import send_alert_email


def evaluate_spike_rule(
    count_6h: int,
    rolling_avg_7d: float,
    is_cross_state: bool = False
) -> Tuple[bool, Optional[str]]:
    """
    Pure logic function for unit testing:
    Returns (is_spike, severity).
    Rule: count_6h > 2 * rolling_avg_7d and rolling_avg_7d > 0
    """
    if rolling_avg_7d <= 0:
        return False, None

    if count_6h > (2.0 * rolling_avg_7d):
        severity = "CRITICAL" if is_cross_state else "WARNING"
        return True, severity

    return False, None


def detect_spikes(
    db: Session,
    ref_time: Optional[datetime.datetime] = None,
    send_email: bool = True
) -> List[Dict[str, Any]]:
    """
    Scans recent complaint volumes by district, computes 7-day rolling average (per 6-hour interval),
    evaluates spike rule, handles deduplication within 6 hours, and records alerts in database.
    """
    if ref_time is None:
        ref_time = utc_now()

    t_7d = ref_time - datetime.timedelta(days=7)
    t_6h = ref_time - datetime.timedelta(hours=6)

    # 1. Fetch complaints in past 7 days
    complaints = db.query(Complaint).filter(
        Complaint.timestamp >= t_7d,
        Complaint.timestamp <= ref_time
    ).all()

    if not complaints:
        return []

    # 2. Get cross-state districts
    cross_districts = set(
        d[0] for d in db.query(MuleAccount.registered_district).filter_by(is_cross_state=True).all()
    )

    # 3. Aggregate complaints per (state, district)
    district_counts_7d: Dict[Tuple[str, str], int] = {}
    district_counts_6h: Dict[Tuple[str, str], int] = {}

    for c in complaints:
        key = (c.state, c.district)
        district_counts_7d[key] = district_counts_7d.get(key, 0) + 1

        c_ts = c.timestamp
        if c_ts.tzinfo is not None and t_6h.tzinfo is None:
            c_ts = c_ts.replace(tzinfo=None)
        elif c_ts.tzinfo is None and t_6h.tzinfo is not None:
            c_ts = c_ts.replace(tzinfo=datetime.timezone.utc)

        if c_ts >= t_6h:
            district_counts_6h[key] = district_counts_6h.get(key, 0) + 1

    # 4. Fetch recent alerts in past 6 hours for deduplication
    recent_alerts = db.query(Alert).filter(Alert.detected_at >= t_6h).all()
    alerted_districts = {a.district for a in recent_alerts}

    detected_spikes_list = []

    for (state, district), count_6h in district_counts_6h.items():
        total_7d = district_counts_7d.get((state, district), 0)
        # In a 7-day period, there are 28 6-hour windows
        rolling_avg_6h_window = round(total_7d / 28.0, 2)
        if rolling_avg_6h_window <= 0.1:
            rolling_avg_6h_window = round(total_7d / 7.0, 2)

        is_cross = (district in cross_districts)
        is_spike, severity = evaluate_spike_rule(count_6h, rolling_avg_6h_window, is_cross_state=is_cross)

        if is_spike:
            msg = f"{severity}: Complaint count ({count_6h}) exceeded 2x rolling avg ({rolling_avg_6h_window:.2f})"
            if is_cross:
                msg += " with active cross-state mule linkages."

            # Log alert in DB
            alert = Alert(
                district=district,
                state=state,
                severity=severity,
                detected_at=ref_time,
                triggered_by="auto",
                complaint_count=count_6h,
                rolling_avg=rolling_avg_6h_window,
                cross_state=is_cross,
                message=msg
            )
            db.add(alert)

            # Check email deduplication
            email_sent = False
            if send_email and (district not in alerted_districts):
                send_alert_email(
                    district=district,
                    state=state,
                    severity=severity,
                    complaint_count=count_6h,
                    message=msg
                )
                email_sent = True

            detected_spikes_list.append({
                "district": district,
                "state": state,
                "severity": severity,
                "complaint_count": count_6h,
                "rolling_avg": rolling_avg_6h_window,
                "cross_state": is_cross,
                "detected_at": ref_time.isoformat(),
                "email_sent": email_sent
            })

    db.commit()
    return detected_spikes_list
