# GitHub Setup & Remote Push Guide for MaintainerGuard

Aapke local system me Git already configured hai:
- **User:** Aman Kumar
- **Email:** ak1276054@gmail.com
- **Local Branch:** `main` (commit already created with all code and research)

---

## Option 1: GitHub CLI (Recommended & Fastest)

Terminal / PowerShell me simply ye run karein:

```bash
gh auth login
```
* Select: `GitHub.com` ➔ `HTTPS` ➔ `Login with a web browser`.
* Browser me 8-digit code daal kar authorize karein.

Uske baad ek command se repo create karke push karein:
```bash
gh repo create maintainer-guard --public --source=. --remote=origin --push
```

---

## Option 2: Browser se Manually GitHub Repo Banakar Push Karna

1. [github.com/new](https://github.com/new) par jayein.
2. Repository Name daalein: `maintainer-guard`
3. Description: `Autonomous Open-Source PR Triage & Proof-of-Intent Firewall for Hacktoberfest 2026`
4. Visibility: **Public**
5. *(Initialize with README ko UNCHECK rakhein, kyunki local me already ready hai)*
6. "Create repository" par click karein.
7. Apne terminal me ye 2 commands chala dein:
   ```bash
   git remote add origin https://github.com/<your-username>/maintainer-guard.git
   git push -u origin main
   ```

---

## VS Code Integration

1. VS Code me is folder ko open karein:
   ```bash
   code "C:\Users\ak127\Downloads\hack niat"
   ```
2. Left sidebar me **Source Control icon** (Ctrl+Shift+G) par click karein.
3. Wahan aapko saara git history aur `main` branch connected dikhegi!
