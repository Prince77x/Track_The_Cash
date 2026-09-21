#!/usr/bin/env python3
"""
Migration & Seed script for TrackTheCash Citizen / User Layer.
Adds necessary columns, creates new tables, and seeds demo citizen data.
"""

import sys
import os
import uuid
import datetime
import bcrypt
from sqlalchemy import text
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from backend.app.database import engine, SessionLocal, Base
from backend.app.models import (
    CitizenUser,
    Complaint,
    EvidenceFile,
    ComplaintStatusHistory,
    ComplaintUpdate,
    CitizenNotification,
    SuspiciousActivityReport,
    SafetyGuide,
    utc_now
)


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def run_migration():
    print("[MIGRATION] Checking database schema & adding tables...")
    
    # 1. Create all new tables in Base metadata
    Base.metadata.create_all(bind=engine)
    print("[MIGRATION] Tables initialized via Base.metadata.create_all.")

    # 2. Safely add missing columns to complaints table if not present
    with engine.connect() as conn:
        columns_to_add = [
            ("public_complaint_id", "VARCHAR(64)"),
            ("user_id", "VARCHAR(64)"),
            ("is_draft", "BOOLEAN DEFAULT FALSE"),
            ("source", "VARCHAR(32) DEFAULT 'citizen'"),
            ("incident_date", "DATE"),
            ("incident_time", "VARCHAR(32)"),
            ("city", "VARCHAR(128)"),
            ("financial_details", "JSON DEFAULT '{}'::json"),
            ("suspect_details", "JSON DEFAULT '{}'::json"),
            ("public_updates", "JSON DEFAULT '[]'::json"),
            ("feedback", "JSON DEFAULT '{}'::json")
        ]
        
        for col_name, col_type in columns_to_add:
            try:
                conn.execute(text(f"ALTER TABLE complaints ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
                conn.commit()
            except Exception as e:
                print(f"[MIGRATION] Note for column {col_name}: {e}")
                
        # Also create index on public_complaint_id & user_id
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_complaints_public_id ON complaints(public_complaint_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_complaints_user_id ON complaints(user_id);"))
            conn.commit()
        except Exception as e:
            print(f"[MIGRATION] Index note: {e}")

    print("[MIGRATION] Column schema verification completed.")


def seed_data():
    db = SessionLocal()
    try:
        print("[SEED] Seeding citizen data...")
        
        # 1. Seed / Upsert Demo Citizen User
        citizen = db.query(CitizenUser).filter(CitizenUser.username == "demo_citizen").first()
        if not citizen:
            citizen = CitizenUser(
                public_user_id="TTC-USER-00124",
                username="demo_citizen",
                email="rohan.mehta@example.com",
                full_name="Rohan Mehta",
                phone="+91 98765 43210",
                password_hash=hash_password("citizen123"),
                address="Flat 402, Sea Breeze Apts, Bandra West",
                city="Mumbai",
                district="Mumbai City",
                state="Maharashtra",
                role="user",
                is_active=True,
                is_verified=True
            )
            db.add(citizen)
            db.commit()
            db.refresh(citizen)
            print(f"[SEED] Created citizen user: {citizen.username} (Public ID: {citizen.public_user_id})")
        else:
            print(f"[SEED] Citizen user already exists: {citizen.username}")

        user_public_id = citizen.public_user_id

        # 2. Seed Safety Guides
        guides = [
            {
                "title": "UPI QR Code & Refund Request Scams",
                "category": "UPI & Payment Fraud",
                "summary": "Never scan a QR code or enter your UPI PIN to RECEIVE money. UPI PIN is only required to SEND money.",
                "content": """### Understanding UPI Collect & Refund Scams
Cyber fraudsters often pose as buyers on OLX, marketplace platforms, or customer support executives. They will send you a QR code or initiate a "Collect Request" claiming it is to transfer funds into your account.

#### Critical Security Rules:
1. **Entering UPI PIN = Debiting Money**: You NEVER need to enter your UPI PIN to receive money.
2. **Scanning QR Code = Payment**: QR codes are strictly for transferring out, never receiving funds.
3. **Check Sender VPA**: Verify the Virtual Payment Address before approving any payment requests.
4. **Golden Hour Rule**: If scammed, call 1930 immediately or freeze your UPI app within 2 hours to freeze mule accounts.""",
                "icon_name": "QrCode"
            },
            {
                "title": "Digital Arrest & Fake Law Enforcement Extortion",
                "category": "Impersonation & Extortion",
                "summary": "Police, CBI, ED, or Customs NEVER conduct interrogations or demand fund transfers over Skype/WhatsApp video calls.",
                "content": """### What is 'Digital Arrest'?
Criminal syndicates call victims impersonating Mumbai Police, CBI, Telecom Department, or FedEx/Customs officers. They claim a parcel containing contraband or your Aadhaar is linked to money laundering, and place you under 'digital custody' via video call.

#### Crucial Facts:
1. **No Legal Term as Digital Arrest**: Indian law has NO provision for digital arrest or virtual police custody.
2. **Never Transfer to 'Verification Accounts'**: Government agencies never ask citizens to transfer money to RBI/safe accounts for verification.
3. **Police Uniforms on Video**: Fraudsters use fake set backgrounds and forged seals.""",
                "icon_name": "ShieldAlert"
            },
            {
                "title": "Telegram Part-Time Job & YouTube Like Scams",
                "category": "Investment & Job Scams",
                "summary": "Work-from-home offers promising ₹5000/day for liking videos or reviewing hotels always end in massive crypto or prepaid wallet loss.",
                "content": """### Anatomy of Task Fraud
Scammers recruit victims via WhatsApp/Telegram offering small payouts (₹150–₹500) for completing simple tasks like liking videos. Once trust is established, they add you to VIP investment groups requiring ₹50,000 to ₹10 Lakhs for high returns, which are then locked forever.""",
                "icon_name": "Briefcase"
            },
            {
                "title": "Malicious APKs & Fake Bank Update SMS",
                "category": "Malware & Phishing",
                "summary": "Never install .apk files sent via WhatsApp or SMS claiming to be PAN update, electricity bill, or bank KYC updates.",
                "content": """### Malicious Android APKs
Fraudsters send SMS claiming your electricity will be disconnected or bank account blocked. They provide a phone number or link to download an APK file (e.g. `SBI_KYC_Update.apk`). Once installed, the app intercepts all your incoming SMS OTPs and drains your bank balance.""",
                "icon_name": "Smartphone"
            }
        ]

        for g in guides:
            existing = db.query(SafetyGuide).filter(SafetyGuide.title == g["title"]).first()
            if not existing:
                guide_obj = SafetyGuide(**g)
                db.add(guide_obj)
        db.commit()
        print(f"[SEED] Seeded {len(guides)} safety guides.")

        # 3. Seed Demo Citizen Complaints
        complaints_data = [
            {
                "complaint_id": "CMP-2026-MUM-849201",
                "public_complaint_id": "TTC-2026-000124",
                "user_id": user_public_id,
                "timestamp": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2, hours=4),
                "state": "Maharashtra",
                "district": "Mumbai City",
                "city": "Mumbai",
                "crime_type": "UPI Fraud",
                "amount_inr": 85000.0,
                "status": "UNDER_INVESTIGATION",
                "is_draft": False,
                "source": "citizen",
                "incident_date": (datetime.date.today() - datetime.timedelta(days=2)),
                "incident_time": "14:30",
                "complainant_name": "Rohan Mehta",
                "contact_phone": "+91 98765 43210",
                "transaction_id": "TXN90284729104",
                "atm_id": "ATM-MUM-BANDRA-04",
                "category": "UPI QR Code Phishing",
                "description": "Fraudulent buyer on OLX sent a fake Google Pay QR code promising payment of ₹85,000 for antique furniture. As soon as I scanned, ₹85,000 was debited in 2 transactions to an unknown IndusInd Bank account.",
                "priority": "HIGH",
                "assigned_officer": "Insp. Vikram Shinde (Cyber Cell Bandra)",
                "financial_details": {
                    "bank_name": "HDFC Bank",
                    "account_number": "XXXX-XXXX-4920",
                    "utr_number": "UTR20260918009283",
                    "payment_channel": "Google Pay / UPI",
                    "loss_amount": 85000.0,
                    "recovered_amount": 35000.0,
                    "frozen_amount": 50000.0
                },
                "suspect_details": {
                    "suspect_name": "Rajesh Kumar / TradeSmart Inc",
                    "suspect_phone": "+91 88765 11223",
                    "suspect_upi": "tradesmart88@indus",
                    "suspect_bank_acc": "IndusInd - 201004928192",
                    "suspect_platform": "OLX / WhatsApp"
                },
                "public_updates": [
                    {
                        "timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=2, hours=2)).isoformat(),
                        "message": "Complaint registered successfully. Assigned Public ID TTC-2026-000124. Automated I4C telemetry alerted.",
                        "author": "TrackTheCash System"
                    },
                    {
                        "timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1, hours=12)).isoformat(),
                        "message": "Assigned to Cyber Crime Police Station Bandra. Investigating Officer Insp. Vikram Shinde.",
                        "author": "LEA Dispatch"
                    },
                    {
                        "timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=14)).isoformat(),
                        "message": "Lien mark placed on recipient account at IndusInd Bank. ₹50,000 frozen successfully.",
                        "author": "Insp. Vikram Shinde"
                    }
                ],
                "feedback": {}
            },
            {
                "complaint_id": "CMP-2026-MUM-849202",
                "public_complaint_id": "TTC-2026-000189",
                "user_id": user_public_id,
                "timestamp": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=5, hours=8),
                "state": "Maharashtra",
                "district": "Mumbai Suburban",
                "city": "Andheri, Mumbai",
                "crime_type": "Digital Arrest / Extortion",
                "amount_inr": 240000.0,
                "status": "EVIDENCE_REQUESTED",
                "is_draft": False,
                "source": "citizen",
                "incident_date": (datetime.date.today() - datetime.timedelta(days=5)),
                "incident_time": "11:15",
                "complainant_name": "Rohan Mehta",
                "contact_phone": "+91 98765 43210",
                "transaction_id": "TXN48201948201",
                "category": "Impersonation & Fake Police Call",
                "description": "Received video call from someone claiming to be CBI officer in Mumbai regarding illegal parcel sent to Taiwan. Coerced into transferring funds for financial verification.",
                "priority": "CRITICAL",
                "assigned_officer": "SI Ananya Deshmukh (Cyber Intelligence Unit)",
                "financial_details": {
                    "bank_name": "State Bank of India",
                    "account_number": "XXXX-XXXX-9182",
                    "utr_number": "UTR20260915998124",
                    "payment_channel": "IMPS / Netbanking",
                    "loss_amount": 240000.0,
                    "recovered_amount": 0.0,
                    "frozen_amount": 180000.0
                },
                "suspect_details": {
                    "suspect_name": "Officer Sharma (Fake CBI)",
                    "suspect_phone": "+91 91234 56789",
                    "suspect_platform": "Skype / WhatsApp Video",
                    "suspect_bank_acc": "Yes Bank - 098234710293"
                },
                "public_updates": [
                    {
                        "timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=5, hours=6)).isoformat(),
                        "message": "Complaint lodged and escalated to Critical Priority.",
                        "author": "TrackTheCash System"
                    },
                    {
                        "timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)).isoformat(),
                        "message": "Additional evidence required: Please upload Skype call logs and stamped bank statement showing IMPS debit.",
                        "author": "SI Ananya Deshmukh"
                    }
                ],
                "feedback": {}
            },
            {
                "complaint_id": "CMP-2026-MUM-849203",
                "public_complaint_id": "TTC-2026-000045",
                "user_id": user_public_id,
                "timestamp": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=12),
                "state": "Maharashtra",
                "district": "Mumbai City",
                "city": "Mumbai",
                "crime_type": "ATM Withdrawal Fraud",
                "amount_inr": 20000.0,
                "status": "RESOLVED",
                "is_draft": False,
                "source": "citizen",
                "incident_date": (datetime.date.today() - datetime.timedelta(days=13)),
                "incident_time": "22:10",
                "complainant_name": "Rohan Mehta",
                "contact_phone": "+91 98765 43210",
                "transaction_id": "TXN1029384756",
                "atm_id": "ATM-MUM-COLABA-01",
                "category": "ATM Card Skimming",
                "description": "Unauthorized cash withdrawal of ₹20,000 at Colaba ATM while card was in my possession.",
                "priority": "MEDIUM",
                "assigned_officer": "Insp. Rajesh Patil",
                "financial_details": {
                    "bank_name": "ICICI Bank",
                    "account_number": "XXXX-XXXX-1102",
                    "utr_number": "ATM-TXN-998231",
                    "payment_channel": "Debit Card / ATM",
                    "loss_amount": 20000.0,
                    "recovered_amount": 20000.0,
                    "frozen_amount": 0.0
                },
                "suspect_details": {
                    "suspect_name": "Unknown Skimming Device Operator",
                    "suspect_platform": "Physical ATM"
                },
                "public_updates": [
                    {
                        "timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=12)).isoformat(),
                        "message": "Complaint filed.",
                        "author": "TrackTheCash System"
                    },
                    {
                        "timestamp": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=4)).isoformat(),
                        "message": "CCTV footage matched suspect. Chargeback processed by ICICI Bank. Full amount of ₹20,000 refunded to complainant.",
                        "author": "Insp. Rajesh Patil"
                    }
                ],
                "feedback": {
                    "rating": 5,
                    "comment": "Quick action by Mumbai Cyber Cell and bank chargeback. Received full refund in 8 days.",
                    "submitted_at": (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3)).isoformat()
                }
            },
            {
                "complaint_id": "CMP-2026-MUM-DRAFT-01",
                "public_complaint_id": None,
                "user_id": user_public_id,
                "timestamp": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=6),
                "state": "Maharashtra",
                "district": "Mumbai City",
                "city": "Mumbai",
                "crime_type": "Job / Telegram Scam",
                "amount_inr": 15000.0,
                "status": "DRAFT",
                "is_draft": True,
                "source": "citizen",
                "incident_date": datetime.date.today(),
                "incident_time": "09:00",
                "complainant_name": "Rohan Mehta",
                "contact_phone": "+91 98765 43210",
                "category": "Prepaid Task Job Fraud",
                "description": "Draft incident report for Telegram task review scam.",
                "priority": "LOW",
                "financial_details": {
                    "bank_name": "HDFC Bank",
                    "loss_amount": 15000.0
                },
                "suspect_details": {
                    "suspect_platform": "Telegram",
                    "suspect_phone": "+91 77654 33210"
                },
                "public_updates": [],
                "feedback": {}
            }
        ]

        for c_data in complaints_data:
            existing = db.query(Complaint).filter(Complaint.complaint_id == c_data["complaint_id"]).first()
            if not existing:
                cmp_obj = Complaint(**c_data)
                db.add(cmp_obj)
                db.commit()
                db.refresh(cmp_obj)

                # Add initial Status History
                status_hist = ComplaintStatusHistory(
                    complaint_id=cmp_obj.complaint_id,
                    old_status="NONE",
                    new_status=cmp_obj.status,
                    changed_by=cmp_obj.assigned_officer or "System",
                    changed_by_role="lea" if cmp_obj.assigned_officer else "system",
                    public_message=f"Status set to {cmp_obj.status}",
                    changed_at=cmp_obj.timestamp
                )
                db.add(status_hist)

                # Add sample updates for communication thread
                if cmp_obj.status == "EVIDENCE_REQUESTED":
                    update_req = ComplaintUpdate(
                        complaint_id=cmp_obj.complaint_id,
                        sender_id="LEA-OFFICER-002",
                        sender_role="lea",
                        sender_name="SI Ananya Deshmukh",
                        type="EVIDENCE_REQUEST",
                        message="Dear Complainant, to proceed with the legal notice under Sec 91 CrPC to Yes Bank, please upload the stamped PDF bank statement showing transaction UTR20260915998124 and screenshots of the Skype profile used by the scammer.",
                        attachments=["Bank_Statement_Requirement.pdf"],
                        status="PENDING",
                        created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
                    )
                    db.add(update_req)
                
                db.commit()

        # 4. Seed Notifications for Citizen
        notifs = [
            {
                "user_id": user_public_id,
                "type": "CASE_UPDATE",
                "title": "Bank Lien Placed on ₹50,000",
                "message": "Under complaint TTC-2026-000124, IndusInd Bank has placed a lien freeze on ₹50,000 in suspect account.",
                "related_complaint_id": "CMP-2026-MUM-849201",
                "is_read": False,
                "created_at": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=14)
            },
            {
                "user_id": user_public_id,
                "type": "ACTION_REQUIRED",
                "title": "Action Required: Additional Evidence Requested",
                "message": "Investigating Officer SI Ananya Deshmukh has requested stamped bank statement for TTC-2026-000189.",
                "related_complaint_id": "CMP-2026-MUM-849202",
                "is_read": False,
                "created_at": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
            },
            {
                "user_id": user_public_id,
                "type": "ADVISORY",
                "title": "Cyber Advisory: New Digital Arrest Scam Wave",
                "message": "A national advisory has been issued regarding fraudsters posing as Customs/CBI officials on video calls.",
                "related_complaint_id": None,
                "is_read": True,
                "created_at": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=3)
            }
        ]
        for n in notifs:
            existing = db.query(CitizenNotification).filter(
                CitizenNotification.user_id == n["user_id"],
                CitizenNotification.title == n["title"]
            ).first()
            if not existing:
                db.add(CitizenNotification(**n))
        db.commit()
        print(f"[SEED] Seeded notifications.")

        # 5. Seed Suspicious Activity Reports
        suspicious = [
            {
                "reference_id": "TTC-INTEL-000842",
                "user_id": user_public_id,
                "report_type": "phishing_url",
                "identifier": "https://sbi-kyc-verify-online.xyz",
                "description": "Received SMS claiming electricity bill overdue with link to download malicious APK file from fake SBI domain.",
                "evidence_info": {
                    "phone": "+91 99887 76655",
                    "target_bank": "State Bank of India"
                },
                "status": "ANALYZING",
                "created_at": datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
            }
        ]
        for s in suspicious:
            existing = db.query(SuspiciousActivityReport).filter(SuspiciousActivityReport.reference_id == s["reference_id"]).first()
            if not existing:
                db.add(SuspiciousActivityReport(**s))
        db.commit()
        print(f"[SEED] Seeded suspicious activity reports.")

        print("[SEED] Citizen layer migration and seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Migration/Seed error: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run_migration()
    seed_data()
