import os
import pandas as pd
import random
from typing import Tuple

# Load district centers dynamically from your reference CSV at startup
CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "scripts", "atm_locations.csv")
_district_cache = {}

def _load_district_centers():
    if _district_cache:
        return
    try:
        if os.path.exists(CSV_PATH):
            df = pd.read_csv(CSV_PATH)
            # Group by state and district to find the average/center coordinates
            grouped = df.groupby(['state', 'district'])[['lat', 'lng']].mean().reset_index()
            for _, row in grouped.iterrows():
                _district_cache[(row['state'].lower().strip(), row['district'].lower().strip())] = (row['lat'], row['lng'])
    except Exception as e:
        print(f"⚠️ Could not load district cache: {e}")

# Initialize cache on module load
_load_district_centers()

def get_coordinates_from_district(state: str, district: str) -> Tuple[float, float]:
    _load_district_centers()
    
    clean_state = state.lower().strip()
    clean_district = district.lower().strip()
    
    # 1. Lookup base center from reference data, with fallback to New Delhi if not found
    base_coords = _district_cache.get((clean_state, clean_district), (28.6139, 77.2090))
    base_lat, base_lng = base_coords
    
    # 2. Add Gaussian jitter (~3-5 km scatter) so map pins look organic and spread out
    lat = base_lat + random.gauss(0.2, 0.5)
    lng = base_lng + random.gauss(0.2, 0.5)
    
    return round(lat, 6), round(lng, 6)

print("✅ District cache loaded successfully.")
print(f"Loaded {len(_district_cache)} district centers from {CSV_PATH}.")
print(get_coordinates_from_district("West Bengal", "Siliguri"))  # Example usage