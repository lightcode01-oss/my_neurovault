FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ ./backend/

WORKDIR /app/backend

EXPOSE 8001

# Run the FastAPI app (app_run.py uses port 8001)
CMD ["uvicorn", "app_run:app", "--host", "0.0.0.0", "--port", "8001"]
