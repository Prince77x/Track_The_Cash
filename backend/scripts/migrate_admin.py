import datetime
from sqlalchemy import text, inspect
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import (
    LEAOfficer, Case, AuditLog, AdminNotification, AdminSetting,
    Alert, Complaint, ATMLocation, MuleAccount, utc_now
)
from backend.app.auth import hash_password, verify_password


def run_migration():
    print("=== [Admin DB Migration] Starting schema update ===")
    
    # 1. Create any missing tables defined in Base.metadata
    Base.metadata.create_all(bind=engine)
    print("✓ Base.metadata.create_all completed.")

    # 2. Check and add operational columns to 'alerts' if missing
    inspector = inspect(engine)
    alert_cols = [c['name'] for c in inspector.get_columns('alerts')]
    is_sqlite = engine.dialect.name == "sqlite"
    
    with engine.begin() as conn:
        if 'status' not in alert_cols:
            print("Adding 'status' column to alerts table...")
            sql = "ALTER TABLE alerts ADD COLUMN status VARCHAR(32) DEFAULT 'ACTIVE'" if is_sqlite else "ALTER TABLE alerts ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'ACTIVE'"
            conn.execute(text(sql))
        if 'assigned_officer' not in alert_cols:
            print("Adding 'assigned_officer' column to alerts table...")
            sql = "ALTER TABLE alerts ADD COLUMN assigned_officer VARCHAR(128)" if is_sqlite else "ALTER TABLE alerts ADD COLUMN IF NOT EXISTS assigned_officer VARCHAR(128)"
            conn.execute(text(sql))
        if 'investigation_notes' not in alert_cols:
            print("Adding 'investigation_notes' column to alerts table...")
            sql = "ALTER TABLE alerts ADD COLUMN investigation_notes JSON DEFAULT '[]'" if is_sqlite else "ALTER TABLE alerts ADD COLUMN IF NOT EXISTS investigation_notes JSON DEFAULT '[]'::json"
            conn.execute(text(sql))
        if 'action_history' not in alert_cols:
            print("Adding 'action_history' column to alerts table...")
            sql = "ALTER TABLE alerts ADD COLUMN action_history JSON DEFAULT '[]'" if is_sqlite else "ALTER TABLE alerts ADD COLUMN IF NOT EXISTS action_history JSON DEFAULT '[]'::json"
            conn.execute(text(sql))

    print("✓ Alerts table schema synchronized.")

    # 3. Seed initial LEA officers if lea_officers is empty
    db = SessionLocal()
    try:
        officer_count = db.query(LEAOfficer).count()
        if officer_count == 0:
            print("Seeding initial LEA officers...")
            seed_officers = [
                LEAOfficer(
                    officer_id="LEA-UP-NOI-001",
                    username="lea_user",
                    full_name="Insp. Vikram Rathore",
                    email="v.rathore@uppolice.gov.in",
                    phone="+91 98112 34567",
                    state="Uttar Pradesh",
                    district="Gautam Buddha Nagar",
                    unit="Cyber Crime Police Station, Sector 108",
                    designation="Senior Inspector",
                    password_hash=hash_password("lea_pass"),
                    is_active=True,
                    role="lea",
                    created_at=utc_now(),
                    last_active_at=utc_now()
                ),
                LEAOfficer(
                    officer_id="LEA-MH-MUM-042",
                    username="lea_mumbai",
                    full_name="ACP Neha Kulkarni",
                    email="n.kulkarni@mahapolice.gov.in",
                    phone="+91 98200 11223",
                    state="Maharashtra",
                    district="Mumbai Suburban",
                    unit="BKC Cyber Crime Division",
                    designation="Assistant Commissioner",
                    password_hash=hash_password("lea_pass_mh"),
                    is_active=True,
                    role="lea",
                    created_at=utc_now(),
                    last_active_at=utc_now()
                ),
                LEAOfficer(
                    officer_id="LEA-RJ-JAI-018",
                    username="lea_jaipur",
                    full_name="DSP Arvind Meena",
                    email="a.meena@rajasthanpolice.gov.in",
                    phone="+91 94140 98765",
                    state="Rajasthan",
                    district="Jaipur",
                    unit="Special Operations Group (SOG Cyber)",
                    designation="Deputy Superintendent",
                    password_hash=hash_password("lea_pass_rj"),
                    is_active=True,
                    role="lea",
                    created_at=utc_now(),
                    last_active_at=utc_now()
                ),
                LEAOfficer(
                    officer_id="LEA-TS-HYD-009",
                    username="lea_hyderabad",
                    full_name="Insp. S. Srinivas Rao",
                    email="s.rao@tspolice.gov.in",
                    phone="+91 94906 17000",
                    state="Telangana",
                    district="Hyderabad",
                    unit="Cyberabad Cyber Cell",
                    designation="Inspector",
                    password_hash=hash_password("lea_pass_ts"),
                    is_active=True,
                    role="lea",
                    created_at=utc_now(),
                    last_active_at=utc_now()
                ),
                LEAOfficer(
                    officer_id="LEA-KA-BLR-023",
                    username="lea_bengaluru",
                    full_name="Insp. Priya Hegde",
                    email="p.hegde@ksp.gov.in",
                    phone="+91 94808 01000",
                    state="Karnataka",
                    district="Bengaluru Urban",
                    unit="CID Cyber Crime Division",
                    designation="Inspector",
                    password_hash=hash_password("lea_pass_ka"),
                    is_active=True,
                    role="lea",
                    created_at=utc_now(),
                    last_active_at=utc_now()
                )
            ]
            db.add_all(seed_officers)
            db.commit()
            print(f"✓ Seeded {len(seed_officers)} LEA officers.")

        # 4. Seed initial Cases if cases table is empty
        case_count = db.query(Case).count()
        if case_count == 0:
            print("Seeding initial investigation cases...")
            recent_complaints = db.query(Complaint).order_by(Complaint.timestamp.desc()).limit(6).all()
            seed_cases = []
            sample_statuses = ["INVESTIGATING", "ASSIGNED", "ESCALATED", "NEW", "RESOLVED", "INVESTIGATING"]
            sample_priorities = ["CRITICAL", "HIGH", "CRITICAL", "MEDIUM", "LOW", "HIGH"]
            officer_names = ["Insp. Vikram Rathore", "ACP Neha Kulkarni", "DSP Arvind Meena", "Insp. S. Srinivas Rao"]

            for i, comp in enumerate(recent_complaints):
                c_status = sample_statuses[i % len(sample_statuses)]
                c_priority = sample_priorities[i % len(sample_priorities)]
                assigned_name = officer_names[i % len(officer_names)] if c_status != "NEW" else None
                assigned_id = f"LEA-UP-NOI-001" if assigned_name else None

                case_id = f"CAS-2026-{10000 + i}"
                notes = [
                    {
                        "author": "I4C NatGrid Auto-Assignment",
                        "timestamp": (utc_now() - datetime.timedelta(hours=(6 - i))).isoformat(),
                        "note": f"Automated case generated from high-severity complaint {comp.complaint_id} with suspected ATM cash-out of ₹{comp.amount_inr:,.2f}."
                    }
                ]
                if assigned_name:
                    notes.append({
                        "author": "Director S. Verma (Admin)",
                        "timestamp": (utc_now() - datetime.timedelta(hours=(4 - i))).isoformat(),
                        "note": f"Case assigned to {assigned_name} with priority set to {c_priority}."
                    })

                seed_cases.append(Case(
                    case_id=case_id,
                    title=f"Cross-State ATM Cash-Out Syndicate - {comp.district}",
                    complaint_id=comp.complaint_id,
                    atm_id=comp.atm_id,
                    mule_id=comp.mule_account_id,
                    state=comp.state,
                    district=comp.district,
                    amount_inr=comp.amount_inr,
                    priority=c_priority,
                    status=c_status,
                    assigned_officer_id=assigned_id,
                    assigned_officer_name=assigned_name,
                    investigation_notes=notes,
                    created_at=utc_now() - datetime.timedelta(hours=(6 - i)),
                    updated_at=utc_now() - datetime.timedelta(hours=(2 - i)),
                    resolved_at=utc_now() if c_status == "RESOLVED" else None
                ))
            
            db.add_all(seed_cases)
            db.commit()
            print(f"✓ Seeded {len(seed_cases)} investigation cases.")

        # 5. Seed initial Admin Notifications if empty
        notif_count = db.query(AdminNotification).count()
        if notif_count == 0:
            print("Seeding initial notifications...")
            seed_notifs = [
                AdminNotification(
                    timestamp=utc_now() - datetime.timedelta(minutes=12),
                    title="Critical Velocity Spike Detected in Gautam Buddha Nagar",
                    message="Complaint velocity exceeded 3.2x 7-day rolling threshold in Sector 62 ATM Cluster.",
                    type="VELOCITY_SPIKE",
                    severity="critical",
                    is_read=False,
                    metadata_json={"district": "Gautam Buddha Nagar", "state": "Uttar Pradesh"}
                ),
                AdminNotification(
                    timestamp=utc_now() - datetime.timedelta(minutes=45),
                    title="Cross-State Mule Account Multi-Withdrawal",
                    message="Mule ID MULE-RJ-9821 originating in Rajasthan executed 4 consecutive ATM cash-outs in Noida.",
                    type="MULE_FLOW",
                    severity="warning",
                    is_read=False,
                    metadata_json={"mule_id": "MULE-RJ-9821"}
                ),
                AdminNotification(
                    timestamp=utc_now() - datetime.timedelta(hours=2),
                    title="New LEA Field Officer Onboarded",
                    message="Insp. Vikram Rathore (UP Police Cyber Unit) registered and authenticated via FIU-IND gateway.",
                    type="SYSTEM",
                    severity="info",
                    is_read=True,
                    metadata_json={"officer_id": "LEA-UP-NOI-001"}
                )
            ]
            db.add_all(seed_notifs)
            db.commit()
            print(f"✓ Seeded {len(seed_notifs)} admin notifications.")

        # 6. Seed initial Admin Settings if empty
        settings_count = db.query(AdminSetting).count()
        if settings_count == 0:
            print("Seeding default system settings...")
            default_settings = [
                AdminSetting(
                    key="risk_thresholds",
                    value={
                        "critical_risk_score": 0.70,
                        "high_risk_score": 0.50,
                        "velocity_spike_multiplier": 2.5,
                        "cross_state_auto_alert": True
                    },
                    updated_at=utc_now(),
                    updated_by="admin_user"
                ),
                AdminSetting(
                    key="alert_preferences",
                    value={
                        "auto_smtp_dispatch": True,
                        "email_recipients": ["lea_noida@police.gov.in", "i4c_ops@mha.gov.in"],
                        "sms_gateway_enabled": False,
                        "sound_alerts_enabled": True
                    },
                    updated_at=utc_now(),
                    updated_by="admin_user"
                ),
                AdminSetting(
                    key="report_preferences",
                    value={
                        "daily_export_format": "csv",
                        "auto_archive_days": 90,
                        "confidentiality_header": "TOP SECRET // LAW ENFORCEMENT SENSITIVE"
                    },
                    updated_at=utc_now(),
                    updated_by="admin_user"
                )
            ]
            db.add_all(default_settings)
            db.commit()
            print(f"✓ Seeded {len(default_settings)} default admin settings.")

        # 7. Seed initial Audit Log if empty
        audit_count = db.query(AuditLog).count()
        if audit_count == 0:
            db.add(AuditLog(
                timestamp=utc_now(),
                admin_user="admin_user",
                action="SYSTEM_INIT",
                resource="system",
                resource_id="SYS-BOOT",
                details={"status": "Admin Command & Intelligence Center Initialized"},
                ip_address="127.0.0.1"
            ))
            db.commit()
            print("✓ Initialized audit log.")

    finally:
        db.close()

    print("=== [Admin DB Migration] Completed Successfully ===")


if __name__ == "__main__":
    run_migration()
