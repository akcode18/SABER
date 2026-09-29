# scripts/live_sync_daemon.py
import os
import sys
import time
import subprocess
from datetime import datetime, timezone

CHECK_INTERVAL_SECONDS = 900  # 15 minutes (matches INSAT transmission cycles)

def run_sync_cycle():
    utc_now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')
    print(f"\n[{utc_now}] Checking operational INSAT feeds & NIO basin activity...")
    try:
        # sys.executable ensures the virtual environment (.venv) python is used
        result = subprocess.run(
            [sys.executable, "scripts/run_real_satellite_feed.py"],
            capture_output=True,
            text=True,
            env=dict(os.environ, PYTHONPATH=".")
        )
        if result.stdout:
            print(result.stdout.strip())
        if result.stderr:
            print(f"[LOG] {result.stderr.strip()}")
    except Exception as e:
        print(f"[ERROR] Sync cycle encountered an issue: {e}")

if __name__ == "__main__":
    print("=" * 65)
    print("SABER AUTOMATED SATELLITE SYNC DAEMON STARTED")
    print(f"Using Environment Python: {sys.executable}")
    print("Listening for North Indian Ocean remote sensing feeds...")
    print("=" * 65)
    while True:
        run_sync_cycle()
        time.sleep(CHECK_INTERVAL_SECONDS)