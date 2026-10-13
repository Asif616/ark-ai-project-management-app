# ARK

Project management app: projects, Kanban tasks, dashboard, notifications, and an optional AI assistant. React + Vite client, FastAPI server, Postgres, Supabase Auth.

## Stack

- Client: React 18, Vite, Tailwind, react-router, recharts, Supabase JS
- Server: FastAPI, SQLAlchemy, LangGraph + Groq (agent chat)
- Auth: Supabase (JWT verified server-side)
- Deploy: Docker Compose (server + nginx-served client)

## Quickstart (Docker)

```bash
cp .env.example .env   # fill in values
docker compose up --build
```

- App: http://localhost:8080
- API proxied same-origin at `/api`

## Local dev

```bash
# server
cd server
pip install -r requirements.txt
uvicorn main:app --reload   # needs DATABASE_URL, SUPABASE_*, BACKEND_CORS_ORIGINS

# client (new terminal)
cd client
npm install
npm run dev   # http://localhost:5173, set VITE_API_BASE_URL + VITE_SUPABASE_* in client/.env
```

## Env

Single `.env` at repo root for compose (see `.env.example`). Required:

| Var | Used for |
| --- | --- |
| `DATABASE_URL` | Postgres connection |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Auth verification |
| `BACKEND_CORS_ORIGINS` | CORS allowlist |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Client auth (baked at build) |
| `GROQ_API_KEY` | Optional, `/agent/chat` only |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional, seeds admin on first boot |

## Scripts

- Client: `npm run dev | build | preview | lint`, `npm test`
- Server: `pytest`, `ruff check .`

## Structure

```
client/   # React SPA (nginx serves dist, proxies /api -> server:8000)
server/   # FastAPI (routers/, services/, main.py)
docker-compose.yml
.env.example
```
