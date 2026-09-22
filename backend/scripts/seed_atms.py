import pandas as pd
import os
from datetime import date
from app.database import SessionLocal
from app.models import ATMLocation, ATMRiskHistory

def import_csv_to_db(csv_file_path):
    session = SessionLocal()
    try:
        # 1. Check if data already exists BEFORE reading the CSV
        existing_atms_count = session.query(ATMLocation).count()
        if existing_atms_count > 0:
            print(f"✅ Data already uploaded! Found {existing_atms_count} ATMs in database. Skipping CSV import.")
            return # Exits the function immediately without touching the CSV

        print(f"📥 No ATMs found in database. Reading from {csv_file_path}...")
        df = pd.read_csv(csv_file_path)
        
        atm_locations = []
        risk_histories = []
        current_date = date.today()
        
        for _, row in df.iterrows():
            atm = ATMLocation(
                atm_id=str(row['atm_id']),
                lat=float(row['lat']),
                lng=float(row['lng']),
                state=str(row['state']),
                district=str(row['district']),
                bank_name=str(row['bank_name'])
            )
            atm_locations.append(atm)
            
            history = ATMRiskHistory(
                atm_id=str(row['atm_id']),
                date=current_date,
                risk_score=0.0,
                complaint_count=0,
                spike_flag=False,
                district=str(row['district']),
                state=str(row['state'])
            )
            risk_histories.append(history)
        
        session.bulk_save_objects(atm_locations)
        session.bulk_save_objects(risk_histories)
        session.commit()
        print(f"🎉 Successfully imported {len(atm_locations)} new ATM records.")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Failed to import data: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    csv_path = os.path.join(os.path.dirname(__file__), "atm_locations.csv")
    import_csv_to_db(csv_path)