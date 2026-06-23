# Meroos

Meroos is an educational platform for schools — quizzes and assessments, live
Kahoot-style games, learning resources, news, class/organization management, and
analytics, with role-based access for admins, teachers, students, and guests.

## Tech stack

| Layer      | Technology |
|------------|-----------|
| Backend    | Django 5 + Django REST Framework, Channels (ASGI/WebSockets), SimpleJWT |
| Realtime   | Django Channels over Redis (live Kahoot games) |
| Frontend   | React 19 + TypeScript + Vite, Recharts |
| Database   | PostgreSQL (SQLite for quick local dev) |
| Infra      | Docker + docker-compose, nginx, WhiteNoise, Daphne |

## Repository layout

```
backend/    Django project (apps: accounts, organizations, quizzes,
            resources, news, analytics) + Dockerfile
frontend/   React + Vite SPA + Dockerfile (nginx)
docker-compose.yml   Full stack: postgres, redis, backend, frontend
```

## Quick start with Docker (recommended)

Requires Docker with the Compose plugin.

```bash
cp .env.example .env          # then edit SECRET_KEY and the DB password
docker compose up --build
```

- App: <http://localhost:8080>
- Django admin: <http://localhost:8080/admin/>

The backend container waits for Postgres, runs migrations, and collects static
files automatically on start. Create an initial admin user:

```bash
docker compose exec backend python manage.py createsuperuser
```

## Local development (without Docker)

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # defaults to SQLite + console email — fine for dev
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver     # http://localhost:8000
```

Live Kahoot WebSockets need Redis running locally (`redis-server`). The REST
API works without it.

### Frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

In development the SPA talks to the backend at `http://localhost:8000`. These
defaults live in `frontend/src/config.ts` and can be overridden with
`VITE_API_URL` / `VITE_WS_URL` / `VITE_BACKEND_URL`.

## Configuration

All backend settings are environment-driven — see `.env.example` for the full
list. Key variables:

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Django secret / JWT signing key (**required** when `DEBUG=False`) |
| `DEBUG` | `True` for dev, `False` for production |
| `ALLOWED_HOSTS` | Comma-separated hostnames |
| `DATABASE_*` | Postgres connection (defaults to SQLite if `DATABASE_ENGINE` is unset) |
| `REDIS_HOST` / `REDIS_PORT` | Channels, cache, and Celery broker |
| `EMAIL_*` | SMTP delivery (defaults to console output) |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins |

## Tests

```bash
cd backend
python manage.py test
```

## API documentation

With the backend running:

- Swagger UI: <http://localhost:8000/api/docs/>
- ReDoc: <http://localhost:8000/api/redoc/>
- OpenAPI schema: <http://localhost:8000/api/schema/>
