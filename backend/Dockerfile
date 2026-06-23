# Meroos backend — Django ASGI (Channels/Daphne)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Minimal system deps. psycopg2-binary and Pillow ship manylinux wheels, so we
# only add curl (used by the compose healthcheck).
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

# Runtime dirs + non-root user
RUN mkdir -p /app/static /app/staticfiles /app/media /app/logs \
    && chmod +x docker/entrypoint.sh \
    && adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

ENTRYPOINT ["sh", "docker/entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
