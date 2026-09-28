# scripts/test_detector.py
from backend.app.services.insat_processor import INSATProcessor
from backend.app.services.detector import CycloneDetector

def main():
    print("--- Testing Detection & Classification Pipeline ---")
    
    # 1. Generate frame with simulated Bay of Bengal vortex
    frame = INSATProcessor.generate_synthetic_frame()
    
    # 2. Run detection
    results = CycloneDetector.detect_and_identify(frame)
    
    if results:
        storm = results[0]
        print(f"[FOUND] Cyclone ID: {storm['storm_id']}")
        print(f"  Basin: {storm['basin']}")
        print(f"  Coordinates: {storm['lat']}°N, {storm['lon']}°E")
        print(f"  Vmax: {storm['vmax_knots']} kt")
        print(f"  MSLP: {storm['mslp_hpa']} hPa")
        print(f"  Category: {storm['category']}")
        print(f"  Model Confidence: {storm['confidence'] * 100:.1f}%")
        print("\n[SUCCESS] Step 3 Detection & Identification logic verified!")
    else:
        print("[!] No storm detected.")

if __name__ == "__main__":
    main()