"""
Connexion MongoDB partagée – écrit dans les mêmes collections que le backend Node.js.
Collections : ailogs, recommendations
"""
import os
from datetime import datetime, timezone
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/healthai")

_client: Optional[AsyncIOMotorClient] = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URI)
    return _client


def get_db():
    db_name = MONGODB_URI.rsplit("/", 1)[-1].split("?")[0]
    return get_client()[db_name]


async def save_ai_log(
    db,
    user_id: str,
    request_id: str,
    service: str,
    status: str,
    input_data: dict,
    output: Optional[str] = None,
    error: Optional[str] = None,
    latency_ms: Optional[int] = None,
) -> str:
    now = datetime.now(timezone.utc)
    doc: dict = {
        "userId": user_id,
        "requestId": request_id,
        "service": service,
        "status": status,
        "input": input_data,
        "createdAt": now,
        "updatedAt": now,
    }
    if output is not None:
        doc["output"] = output
    if error is not None:
        doc["error"] = error
    if latency_ms is not None:
        doc["latencyMs"] = latency_ms
    result = await db["ailogs"].insert_one(doc)
    return str(result.inserted_id)


async def save_recommendation(
    db,
    user_id: str,
    rec_type: str,
    prompt: str,
    content: str,
    ai_model: str,
    tokens: Optional[int] = None,
) -> str:
    now = datetime.now(timezone.utc)
    doc: dict = {
        "userId": user_id,
        "type": rec_type,
        "prompt": prompt,
        "content": content,
        "aiModel": ai_model,
        "createdAt": now,
        "updatedAt": now,
    }
    if tokens is not None:
        doc["tokens"] = tokens
    result = await db["recommendations"].insert_one(doc)
    return str(result.inserted_id)


async def get_recommendations(
    db,
    user_id: str,
    rec_type: Optional[str] = None,
    limit: int = 10,
) -> list[dict]:
    query: dict = {"userId": user_id}
    if rec_type:
        query["type"] = rec_type
    cursor = db["recommendations"].find(query).sort("createdAt", -1).limit(limit)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results
