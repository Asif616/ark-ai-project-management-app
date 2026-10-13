from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, text

from config import BACKEND_CORS_ORIGINS
from database import Base, engine
from routers import agent, auth, users, projects, tasks, dashboard, notifications
from seed_admin import seed_admin


# ponytail: inline column check for existing sqlite files; move to alembic when schema churn grows
_COLUMNS = {"tasks": {"due_date": "DATE"}, "users": {"must_change_password": "BOOLEAN DEFAULT 0"}}


def _ensure_columns() -> None:
    insp = inspect(engine)
    tables = insp.get_table_names()
    for table, columns in _COLUMNS.items():
        if table not in tables:
            continue
        existing = {c["name"] for c in insp.get_columns(table)}
        for name, ddl in columns.items():
            if name not in existing:
                with engine.begin() as conn:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


_ensure_columns()
Base.metadata.create_all(bind=engine)
seed_admin()

app = FastAPI(title="ARK - Project Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ponytail: catch LookupError broadly; a stray KeyError would 404 instead of 500
@app.exception_handler(LookupError)
def not_found_handler(request: Request, exc: LookupError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": str(exc)})


@app.exception_handler(ValueError)
def bad_request_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": str(exc)})


for _router in (auth, users, projects, tasks, dashboard, notifications, agent):
    app.include_router(_router.router)


@app.get("/")
def root():
    return {"message": "ARK server is running"}
