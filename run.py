import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("🛡️  Starting MaintainerGuard Server (Hacktoberfest 2026 Edition)")
    print("📍 Dashboard URL: http://127.0.0.1:8000")
    print("⚡ Autonomous PR & Issue Triage Engine Active")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
