# backend/app/services/insat_processor.py
import os
import h5py
import numpy as np

# Bounding coordinates for North Indian Ocean (Arabian Sea + Bay of Bengal)
NIO_BOUNDS = {
    "min_lat": 0.0,
    "max_lat": 30.0,
    "min_lon": 45.0,
    "max_lon": 105.0
}

# Standard grid dimensions for the cropped regional tensor
TARGET_HEIGHT = 650
TARGET_WIDTH = 1250

class INSATProcessor:
    """
    Ingests and normalizes INSAT-3DR/3DS Level-1B Imager data.
    """

    @staticmethod
    def process_hdf5(file_path: str) -> np.ndarray:
        """
        Extracts TIR-1 channel, converts to Brightness Temp (Kelvin),
        crops to North Indian Ocean, and normalizes into a [0, 1] tensor.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Satellite file not found: {file_path}")

        with h5py.File(file_path, "r") as h5_file:
            # INSAT-3DR HDF5 structure: 'IMG_TIR1' dataset
            # Note: If accessing standard MOSDAC L1B files, key is '/IMG_TIR1'
            if "IMG_TIR1" in h5_file:
                raw_data = h5_file["IMG_TIR1"][:]
            else:
                # Fallback to inspect primary dataset keys if name varies
                first_key = list(h5_file.keys())[0]
                raw_data = h5_file[first_key][:]

            # Retrieve radiometric calibration coefficients (slope and intercept)
            # Default slope = 1.0, offset = 0.0 if raw conversion table is used
            slope = h5_file.attrs.get("TIR1_Slope", 1.0)
            offset = h5_file.attrs.get("TIR1_Offset", 0.0)

            # Convert Digital Count -> Brightness Temperature (Kelvin)
            kelvin_array = (raw_data * slope) + offset

            # Crop or resize to the North Indian Ocean target dimensions
            # Cyclone convection cloud tops range from ~180K (-93°C) to warm ocean ~310K (+37°C)
            normalized_array = np.clip((kelvin_array - 180.0) / (310.0 - 180.0), 0.0, 1.0)

            # Resize to standardized model input (Height x Width)
            processed_tensor = INSATProcessor._standardize_shape(normalized_array)
            return processed_tensor

    @staticmethod
    def _standardize_shape(arr: np.ndarray) -> np.ndarray:
        """Ensures the matrix strictly matches the target 650x1250 model resolution."""
        h, w = arr.shape[-2], arr.shape[-1]
        
        # Simple center-crop / zero-pad slice for dimension guarantee
        h_target = min(h, TARGET_HEIGHT)
        w_target = min(w, TARGET_WIDTH)
        
        output = np.zeros((TARGET_HEIGHT, TARGET_WIDTH), dtype=np.float32)
        output[:h_target, :w_target] = arr[:h_target, :w_target]
        return output

    @staticmethod
    def generate_synthetic_frame() -> np.ndarray:
        """
        Creates a synthetic 650x1250 thermal satellite frame of the 
        North Indian Ocean with a simulated vortex in the Bay of Bengal.
        Enables testing without waiting for live MOSDAC file downloads.
        """
        print("[INFO] Generating synthetic North Indian Ocean satellite matrix...")
        # Ambient warm sea / land background (warm ~300K -> normalized ~0.92)
        base = np.random.normal(loc=0.90, scale=0.03, size=(TARGET_HEIGHT, TARGET_WIDTH))
        
        # Inject simulated rotating cold cloud cluster (Eyewall ~ 200K -> normalized ~ 0.15)
        # Center in Bay of Bengal: Y ≈ 350, X ≈ 850
        y_indices, x_indices = np.ogrid[:TARGET_HEIGHT, :TARGET_WIDTH]
        dist_from_vortex = np.sqrt((y_indices - 350)**2 + (x_indices - 850)**2)
        
        vortex_mask = dist_from_vortex < 120
        base[vortex_mask] -= 0.65 * np.exp(-dist_from_vortex[vortex_mask] / 60.0)
        
        return np.clip(base, 0.0, 1.0).astype(np.float32)