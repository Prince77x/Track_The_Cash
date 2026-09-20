import sys
from sqlalchemy import text, inspect
from backend.app.database import engine

def run_migration():
    is_sqlite = engine.dialect.name == "sqlite"
    with engine.connect() as conn:
        with conn.begin():
            # Drop old check constraints if they exist (Postgres only)
            if not is_sqlite:
                print("Dropping legacy check constraints...")
                try:
                    conn.execute(text("ALTER TABLE complaints DROP CONSTRAINT IF EXISTS check_complaint_status;"))
                    conn.execute(text("ALTER TABLE complaints DROP CONSTRAINT IF EXISTS check_crime_type;"))
                except Exception as e:
                    print(f"Warning dropping constraints: {e}")

            # Add new columns idempotently
            inspector = inspect(engine)
            existing_cols = [c['name'] for c in inspector.get_columns('complaints')] if 'complaints' in inspector.get_table_names() else []
            
            columns_to_add = [
                ("complainant_name", "VARCHAR(128) DEFAULT 'Citizen User'"),
                ("contact_phone", "VARCHAR(64) DEFAULT '+91 98765 43210'"),
                ("transaction_id", "VARCHAR(64)"),
                ("atm_id", "VARCHAR(64)"),
                ("category", "VARCHAR(64) DEFAULT 'ATM Cash-Out Anomaly'"),
                ("description", "TEXT DEFAULT 'Suspicious cash withdrawal activity detected'"),
                ("priority", "VARCHAR(16) DEFAULT 'HIGH'"),
                ("assigned_officer", "VARCHAR(128)"),
                ("investigation_notes", "JSON DEFAULT '[]'" if is_sqlite else "JSON DEFAULT '[]'::json"),
                ("resolution_summary", "TEXT"),
                ("resolved_at", "TIMESTAMP"),
                ("updated_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ]

            for col_name, col_type in columns_to_add:
                if col_name not in existing_cols:
                    print(f"Ensuring column {col_name} exists...")
                    sql = f"ALTER TABLE complaints ADD COLUMN {col_name} {col_type}" if is_sqlite else f"ALTER TABLE complaints ADD COLUMN IF NOT EXISTS {col_name} {col_type}"
                    conn.execute(text(sql))

            # Create indexes for search performance
            print("Creating performance indexes...")
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_complaints_priority ON complaints (priority);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_complaints_status ON complaints (status);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_complaints_atm_id ON complaints (atm_id);"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_complaints_transaction_id ON complaints (transaction_id);"))

            # Update existing 'pending' status records to have appropriate initial priority
            print("Synchronizing default values for existing rows...")
            conn.execute(text("""
                UPDATE complaints 
                SET 
                    priority = CASE 
                        WHEN amount_inr >= 100000 THEN 'CRITICAL'
                        WHEN amount_inr >= 50000 THEN 'HIGH'
                        WHEN amount_inr >= 20000 THEN 'MEDIUM'
                        ELSE 'LOW'
                    END,
                    category = CASE
                        WHEN crime_type = 'otp_fraud' THEN 'OTP / Phishing Scam'
                        WHEN crime_type = 'atm_card_fraud' THEN 'ATM Card Skimming / Cash-Out'
                        WHEN crime_type = 'investment_scam' THEN 'Investment Fraud Mule Funnel'
                        ELSE 'Suspicious Transaction'
                    END
                WHERE priority IS NULL OR priority = 'HIGH';
            """))

    print("Complaints table migration completed successfully!")

if __name__ == "__main__":
    run_migration()
