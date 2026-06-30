# HomeSphere AI

HomeSphere AI is a premium, AI-powered home services platform connecting customers with verified service professionals. This repository contains the unified monorepo system.

## 1. Monorepo Project Structure

```
├── apps/
│   ├── web/         # Next.js 15+ Customer/Professional/Admin Frontends
│   └── api/         # FastAPI Backend Core (AI routing, Bookings, Payments)
├── packages/
│   └── types/       # Shared TypeScript Type definitions
└── docker-compose.yml
```

---

## 2. Authentication Configuration (Firebase Admin SDK)

Backend authentication is powered by the **Firebase Admin SDK**.

### Local Setup
1. Place your service account JSON file inside `apps/api/secrets/firebase-admin.json`.
2. Ensure the file path matches the `.env` settings:
   `FIREBASE_SERVICE_ACCOUNT=apps/api/secrets/firebase-admin.json`
3. The folder `apps/api/secrets/` and all local `.json` configurations are ignored by `.gitignore` automatically to safeguard secrets.

### Production Setup (Render / Heroku)
Store the raw content of your Firebase service account JSON file as an environment variable value:
* **Key**: `FIREBASE_SERVICE_ACCOUNT`
* **Value**: `{ "type": "service_account", "project_id": ... }`

The FastAPI backend dynamically parses the string context as a credentials certificate singleton.

---

## 3. Database Initialization & Seeding

The database layer runs on **SQLAlchemy 2.0**.
* **Engine Connection**: The engine tests connectivity to PostgreSQL on boot. If PostgreSQL is offline, it dynamically registers a local file-based database (`homesphere.db`) using **SQLite**.
* **Seed Records**: If the database contains 0 user logs, the system automatically inserts initial records:
  - Super Admin: `9369022460sa@gmail.com`
  - Active Worker: `xatyammishra07@gmail.com`
  - 10+ professionals across categories, plus sample booking timelines and payment logs.

---

## 4. Run Locally

### Start Backend (FastAPI)
```bash
cd apps/api
pip install -r requirements.txt
python -m uvicorn app.main:app --port 8000 --reload
```

### Start Frontend (Next.js)
```bash
# From workspace root
npm run dev --workspace=homesphere-web
```
Visit http://localhost:3000 to interact with the application.
# HomeSphereAI
# HomeServiceAI
