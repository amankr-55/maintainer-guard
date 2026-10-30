import sys
import threading
import time
import webbrowser
import uvicorn
from app.main import app

def open_browser():
    time.sleep(1.2)
    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception:
        pass

if __name__ == "__main__":
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print("=" * 60)
    print("[*] Starting MaintainerGuard Server (Hacktoberfest 2026 Edition)")
    print("[*] Dashboard URL: http://127.0.0.1:8000")
    print("[*] Opening browser automatically...")
    print("[!] NOTE: Do not press Ctrl+C in terminal (it stops the server).")
    print("=" * 60)
    
    # Auto-open browser in background thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    uvicorn.run(app, host="127.0.0.1", port=8000)
