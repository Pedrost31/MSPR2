FROM python:3.12-slim

WORKDIR /app

COPY shared/ ./shared/
COPY api1_food_recognition/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api1_food_recognition/ .

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
