#!/bin/sh
set -e

# Wait for the database to accept connections (skipped automatically for sqlite).
python - <<'PY'
import os, time
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.db import connections
from django.db.utils import OperationalError

conn = connections["default"]
if conn.settings_dict["ENGINE"].endswith("sqlite3"):
    raise SystemExit(0)

for _ in range(60):
    try:
        conn.ensure_connection()
        print("Database ready.")
        break
    except OperationalError:
        print("Waiting for database...")
        time.sleep(1)
else:
    raise SystemExit("Database not reachable after 60s")
PY

echo "Applying migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

exec "$@"
