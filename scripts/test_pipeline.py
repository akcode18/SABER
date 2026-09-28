# scripts/test_pipeline.py
from backend.app.services.insat_processor import INSATProcessor
from backend.app.services.weather_extractor import AtmosphericExtractor

def main():
    print("--- 1. Testing INSAT Satellite Processing ---")
    # Generates synthetic North Indian Ocean satellite matrix
    sat_tensor = INSATProcessor.generate_synthetic_frame()
    print(f"Output Matrix Shape: {sat_tensor.shape} (Height x Width)")
    print(f"Matrix Min Value: {sat_tensor.min():.4f} (Deepest convection / coldest cloud)")
    print(f"Matrix Max Value: {sat_tensor.max():.4f} (Warm sea surface)")
    
    print("\n--- 2. Testing Atmospheric Parameter Extraction ---")
    weather = AtmosphericExtractor.generate_synthetic_atmosphere()
    vorticity = AtmosphericExtractor.calculate_vorticity(weather["u850"], weather["v850"])
    
    print(f"MSLP Grid Shape: {weather['mslp'].shape}")
    print(f"Minimum Central Pressure Found: {weather['mslp'].min():.1f} hPa")
    print(f"Max 850 hPa Vorticity: {vorticity.max():.2e} s^-1")
    print("\n[SUCCESS] Step 2 Ingestion & Processing Pipeline is ready!")

if __name__ == "__main__":
    main()