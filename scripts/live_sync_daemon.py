# scripts/live_sync_daemon.py
import os
import sys
import time
import subprocess
from datetime import datetime, timezone
import redis

CHECK_INTERVAL_SECONDS = 900  # 15 minutes (matches INSAT transmission cycle)
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

def update_redis_heartbeat():
    """Sets a heartbeat key with a 20-minute expiry (1200 seconds)."""
    try:
        r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=0, socket_timeout=3)
        timestamp = datetime.now(timezone.utc).isoformat()
        r.setex("saber:daemon_heartbeat", 1200, f"active:{timestamp}")
        print(f"[{timestamp}] Redis Heartbeat renewed (TTL: 1200s).")
    except Exception as e:
        print(f"[HEARTBEAT ERROR] Could not reach Redis: {e}")

def run_sync_cycle():
    utc_now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"\n[{utc_now}] Running operational INSAT & NIO synoptic ingest...")
    try:
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
            
        # Renew heartbeat key upon cycle completion
        update_redis_heartbeat()
    except Exception as e:
        print(f"[ERROR] Sync cycle failure: {e}")

if __name__ == "__main__":
    print("=" * 65)
    print("SABER AUTOMATED SATELLITE SYNC DAEMON ACTIVE")
    print(f"Environment Python: {sys.executable}")
    print(f"Target Redis: {REDIS_HOST}:{REDIS_PORT}")
    print("=" * 65)

    # Initial heartbeat pulse on startup
    update_redis_heartbeat()

    while True:
        run_sync_cycle()
        time.sleep(CHECK_INTERVAL_SECONDS)