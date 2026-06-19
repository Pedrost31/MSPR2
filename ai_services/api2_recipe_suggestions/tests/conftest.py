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
    "name": "Alice",
    "age": 28,
    "weight": 65.0,
    "height": 168.0,
    "gender": "female",
    "activityLevel": "moderate",
    "goal": "lose",
    "dailyCalorieTarget": 1800,
}

_RECIPE_RESULT = {
    "suggestions": [
        {
            "name": "Poulet grillé aux légumes",
            "meal_type": "lunch",
            "prep_time_min": 20,
            "calories": 450,
            "protein_g": 38.0,
            "carbs_g": 30.0,
            "fat_g": 12.0,
            "ingredients": ["200g poulet", "100g brocolis", "1 courgette"],
            "instructions": ["Griller le poulet 15 min", "Cuire les légumes à la vapeur"],
            "benefits": "Riche en protéines, idéal pour perte de poids",
        }
    ],
    "daily_tip": "Buvez 2L d'eau par jour",
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
    mocker.patch("routes.recipes.get_db", return_value=db)
    return db


@pytest.fixture
def mock_postgres(mocker):
    mocker.patch("routes.recipes.get_user_profile", new_callable=AsyncMock, return_value=_USER)
    mocker.patch("routes.recipes.get_user_food_entries", new_callable=AsyncMock, return_value=[])


@pytest.fixture
def mock_ollama_recipes(mocker):
    mocker.patch(
        "routes.recipes.ollama_service.generate_recipe_suggestions",
        new_callable=AsyncMock,
        return_value=_RECIPE_RESULT,
    )


@pytest.fixture
def mock_ollama_from_ingredients(mocker):
    mocker.patch(
        "routes.recipes.ollama_service.generate_recipe_from_ingredients",
        new_callable=AsyncMock,
        return_value={
            "name": "Omelette aux épinards",
            "meal_type": "breakfast",
            "calories": 280,
            "ingredients": ["3 œufs", "100g épinards"],
            "instructions": ["Battre les œufs", "Cuire 5 min"],
        },
    )
