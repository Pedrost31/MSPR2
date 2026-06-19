import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport

_USER = {
    "id": "user-123",
    "email": "test@example.com",
    "name": "Bob",
    "age": 30,
    "weight": 80.0,
    "height": 180.0,
    "gender": "male",
    "activityLevel": "active",
    "goal": "gain",
    "dailyCalorieTarget": 2800,
}

_MACROS = {
    "bmr": 1894.0,
    "tdee": 3270.0,
    "calories": 3570,
    "protein_g": 160.0,
    "carbs_g": 420.0,
    "fat_g": 72.0,
    "protein_pct": 17.9,
    "carbs_pct": 47.1,
    "fat_pct": 18.2,
}

_PLAN = {
    "weekly_plan": {
        "monday": {"breakfast": "Flocons d'avoine + banane", "lunch": "Riz + poulet", "dinner": "Saumon + légumes", "snack": "Yaourt grec"},
    },
    "shopping_list": ["Poulet 1kg", "Riz complet 500g"],
    "key_principles": ["Manger toutes les 3h", "Prioriser les protéines"],
    "hydration_tip": "Boire 3L d'eau par jour",
    "supplements": ["Créatine monohydrate"],
}


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
    mocker.patch("routes.diet.get_db", return_value=db)
    return db


@pytest.fixture
def mock_postgres(mocker):
    mocker.patch("routes.diet.get_user_profile", new_callable=AsyncMock, return_value=_USER)
    mocker.patch("routes.diet.get_user_food_entries", new_callable=AsyncMock, return_value=[])


@pytest.fixture
def mock_macros(mocker):
    mocker.patch("routes.diet.get_full_macros", return_value=_MACROS)


@pytest.fixture
def mock_ollama_plan(mocker):
    mocker.patch(
        "routes.diet.ollama_service.generate_diet_plan",
        new_callable=AsyncMock,
        return_value=_PLAN,
    )
