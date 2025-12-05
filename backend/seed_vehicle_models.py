from app import app
from models import db, VehicleMaster
import json

vehicle_data = [
    {"Brand/Model": "BYD - T3 (Cargo)", "Battery Capacity (kWh)": "50.3"},
    {"Brand/Model": "Chery Wanda - 14-Seater Microbus", "Battery Capacity (kWh)": "53.58"},
    {"Brand/Model": "Chery Wanda - City Bus EV", "Battery Capacity (kWh)": "144.97"},
    {"Brand/Model": "Chery Wanda - EV Coach (9M)", "Battery Capacity (kWh)": "208.65"},
    {"Brand/Model": "DFAC (Dongfeng) - EM26 (11-Seater)", "Battery Capacity (kWh)": "41.86"},
    {"Brand/Model": "DFAC (Dongfeng) - EM27 (14-Seater)", "Battery Capacity (kWh)": "53.58"},
    {"Brand/Model": "DFAC (Dongfeng) - EV32 (14+1 Seater)", "Battery Capacity (kWh)": "53.58"},
    {"Brand/Model": "DFSK - Danfe (11-Seater)", "Battery Capacity (kWh)": "42"},
    {"Brand/Model": "DFSK - EC35 (Cargo)", "Battery Capacity (kWh)": "38.6"},
    {"Brand/Model": "Farizon - SuperVAN (19-Seater)", "Battery Capacity (kWh)": "82.88"},
    {"Brand/Model": "Foton - View CS2 (Cargo/Passenger)", "Battery Capacity (kWh)": "50.23"},
    {"Brand/Model": "Golden Dragon - Microbus (14-Seater)", "Battery Capacity (kWh)": "53"},
    {"Brand/Model": "Golden Dragon - Microbus (16-Seater)", "Battery Capacity (kWh)": "53"},
    {"Brand/Model": "Higer - H5C-EV (Standard)", "Battery Capacity (kWh)": "53.58"},
    {"Brand/Model": "Higer - H5C-EV (Long Range)", "Battery Capacity (kWh)": "70.47"},
    {"Brand/Model": "Higer - H5C-EV (Ultra Long)", "Battery Capacity (kWh)": "100.96"},
    {"Brand/Model": "Joylong - E6 (20-Seater)", "Battery Capacity (kWh)": "80"},
    {"Brand/Model": "Jubao - Electric Van (11/14 Seater)", "Battery Capacity (kWh)": "41.86"},
    {"Brand/Model": "KYC - V5", "Battery Capacity (kWh)": "41.86"},
    {"Brand/Model": "KYC - V5D", "Battery Capacity (kWh)": "41.86"},
    {"Brand/Model": "Keyton - M80L (14-Seater)", "Battery Capacity (kWh)": "53.58"},
    {"Brand/Model": "King Long - King Long EV (14-Seater)", "Battery Capacity (kWh)": "50.23"},
    {"Brand/Model": "King Long - King Long EV (16-Seater)", "Battery Capacity (kWh)": "53.58"},
    {"Brand/Model": "King Long - King Long EV (19-Seater)", "Battery Capacity (kWh)": "77.28"},
    {"Brand/Model": "SRM - X30L EV", "Battery Capacity (kWh)": "32.14"},
    {"Brand/Model": "Vanche - 7L-22", "Battery Capacity (kWh)": "120.27"},
    {"Brand/Model": "Vanche - 7L-25", "Battery Capacity (kWh)": "120.27"},
    {"Brand/Model": "Audi - e-tron 55", "Battery Capacity (kWh)": "95"},
    {"Brand/Model": "Audi - Q8 e-tron", "Battery Capacity (kWh)": "107.8"},
    {"Brand/Model": "Avatr - Avatr 11", "Battery Capacity (kWh)": "TBA"},
    {"Brand/Model": "BAW - Brumby", "Battery Capacity (kWh)": "17.28"},
    {"Brand/Model": "BMW - iX1", "Battery Capacity (kWh)": "66.5"},
    {"Brand/Model": "BMW - iX2", "Battery Capacity (kWh)": "66.5"},
    {"Brand/Model": "BYD - Atto 1 (Long)", "Battery Capacity (kWh)": "30.08"},
    {"Brand/Model": "BYD - Atto 1 (Long)", "Battery Capacity (kWh)": "38.88"},
    {"Brand/Model": "BYD - Atto 2", "Battery Capacity (kWh)": "51.13"},
    {"Brand/Model": "BYD - Atto 3 (Advanced)", "Battery Capacity (kWh)": "49.92"},
    {"Brand/Model": "BYD - Atto 3 (Superior)", "Battery Capacity (kWh)": "60.48"},
    {"Brand/Model": "BYD - Dolphin", "Battery Capacity (kWh)": "44.9"},
    {"Brand/Model": "BYD - M6", "Battery Capacity (kWh)": "55.4"},
    {"Brand/Model": "BYD - M6 (MPV)", "Battery Capacity (kWh)": "71.8"},
    {"Brand/Model": "BYD - Seal (Dynamic)", "Battery Capacity (kWh)": "61.44"},
    {"Brand/Model": "BYD - Seal (Premium)", "Battery Capacity (kWh)": "82.6"},
    {"Brand/Model": "BYD - Seal (Performance)", "Battery Capacity (kWh)": "82.6"},
    {"Brand/Model": "BYD - Sealion 7", "Battery Capacity (kWh)": "71.8"},
    {"Brand/Model": "BYD - Sealion 7 Superior", "Battery Capacity (kWh)": "91.3"},
    {"Brand/Model": "BYD - e6", "Battery Capacity (kWh)": "71.7"},
    {"Brand/Model": "Citroen - E-C3 Shine", "Battery Capacity (kWh)": "29.2"},
    {"Brand/Model": "Deepal - E07", "Battery Capacity (kWh)": "90"},
    {"Brand/Model": "Deepal - S05", "Battery Capacity (kWh)": "56.1"},
    {"Brand/Model": "Deepal - S07", "Battery Capacity (kWh)": "66.8"},
    {"Brand/Model": "Deepal - L09", "Battery Capacity (kWh)": "79.9"},
    {"Brand/Model": "Dongfeng - Nammi 01", "Battery Capacity (kWh)": "42.3"},
    {"Brand/Model": "Dongfeng - Vigo", "Battery Capacity (kWh)": "44.94"},
    {"Brand/Model": "Forthing - Friday", "Battery Capacity (kWh)": "64.4"},
    {"Brand/Model": "GWM - ORA 03", "Battery Capacity (kWh)": "47.88"},
    {"Brand/Model": "Henrey - Mincar", "Battery Capacity (kWh)": "16.5"},
    {"Brand/Model": "Neta - Neta V / V50", "Battery Capacity (kWh)": "38.54"},
    {"Brand/Model": "Hyundai - IONIQ 5", "Battery Capacity (kWh)": "58.9"},
    {"Brand/Model": "Hyundai - IONIQ 6", "Battery Capacity (kWh)": "77.4"},
    {"Brand/Model": "Hyundai - Kona", "Battery Capacity (kWh)": "39.2"},
    {"Brand/Model": "Hyundai - Creta EV", "Battery Capacity (kWh)": "42"},
    {"Brand/Model": "JMEV - GSE Elight", "Battery Capacity (kWh)": "49"},
    {"Brand/Model": "Jaecoo - J5", "Battery Capacity (kWh)": "58"},
    {"Brand/Model": "Jaecoo - J6", "Battery Capacity (kWh)": "65.69"},
    {"Brand/Model": "Jaguar - I-Pace", "Battery Capacity (kWh)": "90"},
    {"Brand/Model": "Jinpeng - Lingbox EC01", "Battery Capacity (kWh)": "19.2"},
    {"Brand/Model": "Kia - EV6", "Battery Capacity (kWh)": "77.4"},
    {"Brand/Model": "Kia - EV9", "Battery Capacity (kWh)": "77.4"},
    {"Brand/Model": "Kia - Niro EV", "Battery Capacity (kWh)": "64"},
    {"Brand/Model": "Leapmotor - T03", "Battery Capacity (kWh)": "37.3"},
    {"Brand/Model": "Leapmotor - B10", "Battery Capacity (kWh)": "56"},
    {"Brand/Model": "Leapmotor - B10 Max", "Battery Capacity (kWh)": "67"},
    {"Brand/Model": "Leapmotor - C10", "Battery Capacity (kWh)": "69.9"},
    {"Brand/Model": "MG - Comet EV", "Battery Capacity (kWh)": "17.3"},
    {"Brand/Model": "MG - Cyberster", "Battery Capacity (kWh)": "77"},
    {"Brand/Model": "MG - MG4 Comfort", "Battery Capacity (kWh)": "51"},
    {"Brand/Model": "MG - MG4 Luxury", "Battery Capacity (kWh)": "64"},
    {"Brand/Model": "MG - ZS EV", "Battery Capacity (kWh)": "50.3"},
    {"Brand/Model": "MG - ZS EV (old)", "Battery Capacity (kWh)": "44.5"},
    {"Brand/Model": "MG - ZS EV (long range)", "Battery Capacity (kWh)": "72.6"},
    {"Brand/Model": "MG - S5 Comfort", "Battery Capacity (kWh)": "49"},
    {"Brand/Model": "MG - S5 Deluxe", "Battery Capacity (kWh)": "62"},
    {"Brand/Model": "MG - Windsor", "Battery Capacity (kWh)": "38"},
    {"Brand/Model": "Mahindra - XUV400", "Battery Capacity (kWh)": "39.4"},
    {"Brand/Model": "Mahindra - BE 6", "Battery Capacity (kWh)": "59"},
    {"Brand/Model": "Mahindra - Xev 9e", "Battery Capacity (kWh)": "79"},
    {"Brand/Model": "Mercedes-Benz - EQA", "Battery Capacity (kWh)": "70"},
    {"Brand/Model": "Mercedes-Benz - EQB", "Battery Capacity (kWh)": "80"},
    {"Brand/Model": "Mercedes-Benz - EQC", "Battery Capacity (kWh)": "80"},
    {"Brand/Model": "Mercedes-Benz - EQS 580", "Battery Capacity (kWh)": "107.8"},
    {"Brand/Model": "Nissan - Leaf", "Battery Capacity (kWh)": "40"},
    {"Brand/Model": "OMODA - E5", "Battery Capacity (kWh)": "61"},
    {"Brand/Model": "Proton - e.Mas 7", "Battery Capacity (kWh)": "49.52"},
    {"Brand/Model": "Proton - e.Mas 7 Max", "Battery Capacity (kWh)": "60.22"},
    {"Brand/Model": "Seres - E1", "Battery Capacity (kWh)": "13.8"},
    {"Brand/Model": "Seres - Seres 3", "Battery Capacity (kWh)": "52.7"},
    {"Brand/Model": "Skywell - BE 11", "Battery Capacity (kWh)": "52"},
    {"Brand/Model": "Skywell - ET5", "Battery Capacity (kWh)": "86"},
    {"Brand/Model": "Smart - #1", "Battery Capacity (kWh)": "66"},
    {"Brand/Model": "Tata - Tiago", "Battery Capacity (kWh)": "24"},
    {"Brand/Model": "Tata - Tigor", "Battery Capacity (kWh)": "24"},
    {"Brand/Model": "Tata - Punch", "Battery Capacity (kWh)": "35"},
    {"Brand/Model": "Tata - Nexon", "Battery Capacity (kWh)": "45"},
    {"Brand/Model": "Tesla - Model 3", "Battery Capacity (kWh)": "60"},
    {"Brand/Model": "Tesla - Model Y", "Battery Capacity (kWh)": "78"},
    {"Brand/Model": "Thee Go - E8", "Battery Capacity (kWh)": "15.2"},
    {"Brand/Model": "Wuling - Air EV", "Battery Capacity (kWh)": "17.3"},
    {"Brand/Model": "Wuling - Binguo", "Battery Capacity (kWh)": "31.9"},
    {"Brand/Model": "XPENG - G6", "Battery Capacity (kWh)": "66"},
    {"Brand/Model": "Zeekr - X", "Battery Capacity (kWh)": "66"},
    {"Brand/Model": "Zeekr - OO1", "Battery Capacity (kWh)": "100"}
]

with app.app_context():
    print("Starting vehicle data seeding...")
    
    # Clear existing vehicle master data (optional - comment out if you want to keep existing data)
    # VehicleMaster.query.delete()
    
    added_count = 0
    skipped_count = 0
    
    for vehicle in vehicle_data:
        vehicle_name = vehicle["Brand/Model"]
        battery_capacity_str = vehicle["Battery Capacity (kWh)"]
        
        # Skip TBA values
        if battery_capacity_str == "TBA":
            battery_capacity = None
        else:
            try:
                battery_capacity = float(battery_capacity_str)
            except ValueError:
                battery_capacity = None
        
        # Create a dummy vehicle number for reference (you can customize this)
        # Format: First 3 letters of brand + sequential number
        brand_prefix = vehicle_name.split(' - ')[0][:3].upper().replace(' ', '')
        vehicle_no = f"{brand_prefix}-REF-{added_count + 1:03d}"
        
        # Check if vehicle already exists
        existing = VehicleMaster.query.filter_by(vehicle_name=vehicle_name).first()
        
        if not existing:
            new_vehicle = VehicleMaster(
                vehicle_no=vehicle_no,
                vehicle_name=vehicle_name,
                battery_capacity=battery_capacity,
                phone_no=None
            )
            db.session.add(new_vehicle)
            added_count += 1
            print(f"Added: {vehicle_name} ({battery_capacity} kWh)")
        else:
            skipped_count += 1
            print(f"Skipped (already exists): {vehicle_name}")
    
    db.session.commit()
    print(f"\n✅ Seeding complete!")
    print(f"   Added: {added_count} vehicles")
    print(f"   Skipped: {skipped_count} vehicles")
    print(f"   Total in database: {VehicleMaster.query.count()} vehicles")
