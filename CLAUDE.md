# ICU Backend — NeuroPy GP

This is the backend for a graduation project: an ICU Digital Twin Blood Pressure Control System. The frontend is a React/Vite app (already built). This backend serves it via REST APIs on port 8000.

## Domain context
- Patients are in the ICU with septic shock / hypotension
- We monitor MAP (Mean Arterial Pressure) — target range 65–100 mmHg
- We control Norepinephrine (NOR) infusion rate to stabilize MAP
- Three controllers exist in the paper: LSTM (best TiT: 80.6%), MPC, RL-PID (fastest: 0.1ms)
- We are using MOCK DATA — no real hardware integration yet

## Rules
- All routes must be under /api prefix
- Server runs on PORT from .env (default 8000)
- CORS must allow http://localhost:5173 (Vite frontend)
- Use in-memory state for mock data (no database needed)
- Response shapes must exactly match what api.ts expects

## Key files
- src/data/mockData.js — generators for vitals, infusion, trends (ported from frontend)
- src/data/state.js — shared mutable state across routes
- src/server.js — Express app entry point