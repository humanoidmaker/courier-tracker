# TrackShip - Courier & Delivery Tracker

Full-stack courier tracking application with parcel management, driver assignment, real-time tracking, and delivery proof.

## Stack
- **Backend**: Python FastAPI + Motor (async MongoDB)
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Database**: MongoDB

## Setup

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
python seed_sample_data.py
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Docker
```bash
docker-compose up --build
```

## Default Login
- Email: admin@courier.local
- Password: admin123

## Features
- Parcel booking with auto-calculated charges
- Driver management and assignment
- Real-time tracking timeline
- Public tracking page (no auth)
- Proof of delivery recording
- Reports and analytics
