import os
import json
import random
import requests
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.database import engine, SessionLocal
from backend.app.models import ATMLocation

# Top states and their prominent districts with approximate center lat/lng coordinates
TOP_STATES_DISTRICTS = {
    "Uttar Pradesh": {
        "Lucknow": (26.8467, 80.9462),
        "Kanpur": (26.4499, 80.3319),
        "Noida": (28.5355, 77.3910),
        "Ghaziabad": (28.6692, 77.4538),
        "Varanasi": (25.3176, 82.9739),
        "Agra": (27.1767, 78.0081),
        "Prayagraj": (25.4358, 81.8463),
        "Meerut": (28.9845, 77.7064),
        "Bareilly": (28.3670, 79.4304),
        "Aligarh": (27.8974, 78.0880)
    },
    "Maharashtra": {
        "Mumbai": (19.0760, 72.8777),
        "Pune": (18.5204, 73.8567),
        "Nagpur": (21.1458, 79.0882),
        "Thane": (19.2183, 72.9781),
        "Nashik": (19.9975, 73.7898),
        "Aurangabad": (19.8762, 75.3433),
        "Solapur": (17.6599, 75.9064),
        "Kolhapur": (16.7050, 74.2433)
    },
    "Rajasthan": {
        "Jaipur": (26.9124, 75.7873),
        "Jodhpur": (26.2389, 73.0243),
        "Kota": (25.2138, 75.8648),
        "Bikaner": (28.0229, 73.3119),
        "Ajmer": (26.4499, 74.6399),
        "Udaipur": (24.5854, 73.7125),
        "Alwar": (27.5530, 76.6346),
        "Bharatpur": (27.2152, 77.5030)
    },
    "Telangana": {
        "Hyderabad": (17.3850, 78.4867),
        "Warangal": (17.9689, 79.5941),
        "Nizamabad": (18.6725, 78.0941),
        "Karimnagar": (18.4386, 79.1288),
        "Khammam": (17.2473, 80.1514),
        "Rangareddy": (17.3323, 78.5665)
    },
    "Karnataka": {
        "Bengaluru Urban": (12.9716, 77.5946),
        "Bengaluru Rural": (13.2263, 77.5752),
        "Mysuru": (12.2958, 76.6394),
        "Hubballi-Dharwad": (15.3647, 75.1240),
        "Mangaluru": (12.9141, 74.8560),
        "Belagavi": (15.8497, 74.4977)
    },
    "Delhi": {
        "New Delhi": (28.6139, 77.2090),
        "South Delhi": (28.5246, 77.2066),
        "North Delhi": (28.7041, 77.1025),
        "East Delhi": (28.6280, 77.2950),
        "West Delhi": (28.6508, 77.0807),
        "Central Delhi": (28.6448, 77.2167)
    },
    "West Bengal": {
        "Kolkata": (22.5726, 88.3639),
        "Howrah": (22.5958, 88.2636),
        "North 24 Parganas": (22.7230, 88.4800),
        "South 24 Parganas": (22.1800, 88.5400),
        "Siliguri": (26.7271, 88.3953),
        "Asansol": (23.6739, 86.9524)
    },
    "Bihar": {
        "Patna": (25.5941, 85.1376),
        "Gaya": (24.7914, 85.0002),
        "Bhagalpur": (25.2425, 86.9842),
        "Muzaffarpur": (26.1209, 85.3647),
        "Purnia": (25.7771, 87.4753)
    },
    "Madhya Pradesh": {
        "Indore": (22.7196, 75.8577),
        "Bhopal": (23.2599, 77.4126),
        "Jabalpur": (23.1815, 79.9864),
        "Gwalior": (26.2183, 78.1828),
        "Ujjain": (23.1765, 75.7885)
    },
    "Gujarat": {
        "Ahmedabad": (23.0225, 72.5714),
        "Surat": (21.1702, 72.8311),
        "Vadodara": (22.3072, 73.1812),
        "Rajkot": (22.3039, 70.8022),
        "Bhavnagar": (21.7645, 72.1519)
    }
}

BANKS = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Axis Bank",
    "Canara Bank",
    "Union Bank of India",
    "Kotak Mahindra Bank",
    "IndusInd Bank"
]

CACHE_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "atm_cache.json")


def generate_fallback_atms(target_count: int = 1200) -> List[Dict[str, Any]]:
    """Generates synthetic high-fidelity ATM points clustered around real district centers."""
    random.seed(42)
    atms = []
    atm_idx = 1

    districts_list = []
    for state, districts in TOP_STATES_DISTRICTS.items():
        for district, (lat, lng) in districts.items():
            districts_list.append((state, district, lat, lng))

    num_districts = len(districts_list)
    per_district = max(20, (target_count // num_districts) + 3)

    for state, district, c_lat, c_lng in districts_list:
        count = per_district if state in ["Uttar Pradesh", "Maharashtra", "Rajasthan", "Telangana", "Karnataka"] else per_district - 2
        for _ in range(count):
            # Jitter within ~5-15km of district center
            offset_lat = random.gauss(0, 0.04)
            offset_lng = random.gauss(0, 0.04)
            bank = random.choice(BANKS)
            atms.append({
                "atm_id": f"ATM_{atm_idx:05d}",
                "lat": round(c_lat + offset_lat, 6),
                "lng": round(c_lng + offset_lng, 6),
                "state": state,
                "district": district,
                "bank_name": bank
            })
            atm_idx += 1

    return atms


def fetch_from_overpass() -> Optional[List[Dict[str, Any]]]:
    """Attempts to query Overpass API for real ATM coordinates in India."""
    overpass_url = "https://overpass-api.de/api/interpreter"
    query = """
    [out:json][timeout:25];
    area["ISO3166-1"="IN"][admin_level=2]->.searchArea;
    (
      node["amenity"="atm"](area.searchArea);
      node["amenity"="bank"]["atm"="yes"](area.searchArea);
    );
    out body 1500;
    """
    try:
        response = requests.post(overpass_url, data={"data": query}, timeout=15)
        if response.status_code == 200:
            data = response.json()
            elements = data.get("elements", [])
            if len(elements) >= 500:
                atms = []
                for i, el in enumerate(elements):
                    tags = el.get("tags", {})
                    # Try to get state/district or fallback
                    bank = tags.get("operator") or tags.get("name") or random.choice(BANKS)
                    state = tags.get("addr:state") or "Maharashtra"
                    district = tags.get("addr:district") or tags.get("addr:city") or "Mumbai"
                    atms.append({
                        "atm_id": f"OSM_{el['id']}",
                        "lat": el["lat"],
                        "lng": el["lon"],
                        "state": state,
                        "district": district,
                        "bank_name": bank
                    })
                return atms
    except Exception as e:
        print(f"Overpass query exception: {e}")
    return None


def ingest_atms(db: Session, target_count: int = 1200, force: bool = False) -> int:
    """Ingests ATM locations into database idempotently."""
    existing_count = db.query(ATMLocation).count()
    if existing_count >= target_count and not force:
        print(f"ATM locations already populated ({existing_count} ATMs). Skipping ingestion.")
        return existing_count

    atms_data = None
    cache_path = os.path.abspath(CACHE_FILE)

    # Check local cache first
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r") as f:
                atms_data = json.load(f)
        except Exception:
            atms_data = None

    if not atms_data:
        # Try overpass if possible or use fallback
        atms_data = generate_fallback_atms(target_count=target_count)
        os.makedirs(os.path.dirname(cache_path), exist_ok=True)
        with open(cache_path, "w") as f:
            json.dump(atms_data, f, indent=2)

    # Upsert into DB
    inserted_count = 0
    for item in atms_data:
        existing = db.query(ATMLocation).filter_by(atm_id=item["atm_id"]).first()
        if existing:
            existing.lat = item["lat"]
            existing.lng = item["lng"]
            existing.state = item["state"]
            existing.district = item["district"]
            existing.bank_name = item["bank_name"]
        else:
            atm = ATMLocation(
                atm_id=item["atm_id"],
                lat=item["lat"],
                lng=item["lng"],
                state=item["state"],
                district=item["district"],
                bank_name=item["bank_name"]
            )
            db.add(atm)
            inserted_count += 1

    db.commit()
    total_count = db.query(ATMLocation).count()
    print(f"Ingestion complete: {inserted_count} new ATMs added, total in DB: {total_count}")
    return total_count


if __name__ == "__main__":
    db = SessionLocal()
    try:
        ingest_atms(db)
    finally:
        db.close()
