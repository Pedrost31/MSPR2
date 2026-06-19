import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport


@pytest.fixture
async def client():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_db(mocker):
    _ailogs = MagicMock()
    _ailogs.insert_one = AsyncMock(return_value=MagicMock(inserted_id="log-id"))
    _recommendations = MagicMock()
    _recommendations.insert_one = AsyncMock(return_value=MagicMock(inserted_id="rec-id"))
    _cols = {"ailogs": _ailogs, "recommendations": _recommendations}

    db = MagicMock()
    db.__getitem__ = MagicMock(side_effect=lambda key: _cols[key])
    mocker.patch("routes.food_recognition.get_db", return_value=db)
    mocker.patch("shared.mongodb.get_db", return_value=db)
    return db


@pytest.fixture
def mock_ollama(mocker):
    return mocker.patch(
        "routes.food_recognition.ollama_service.analyze_food_image",
        new_callable=AsyncMock,
        return_value={
            "food_name": "Pomme",
            "ingredients": ["pomme"],
            "portion_size": "1 pomme moyenne (182g)",
            "nutrition": {
                "calories": 95,
                "protein_g": 0.5,
                "carbs_g": 25.1,
                "fat_g": 0.3,
                "fiber_g": 4.4,
            },
            "confidence": "high",
            "notes": "Pomme rouge fraîche",
        },
    )
