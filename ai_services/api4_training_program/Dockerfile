FROM python:3.12-slim

WORKDIR /app

COPY shared/ ./shared/
COPY api4_training_program/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api4_training_program/ .

EXPOSE 8004
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8004"]
