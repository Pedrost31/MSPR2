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
    "name": "Charlie",
    "age": 25,
    "weight": 75.0,
    "height": 175.0,
    "gender": "male",
    "activityLevel": "active",
    "goal": "gain",
    "dailyCalorieTarget": 3000,
}

_PROGRAM = {
    "program_name": "Programme Prise de Masse",
    "difficulty": "avancé",
    "weekly_sessions": 5,
    "weekly_plan": {
        "monday": {
            "type": "strength",
            "name": "Poitrine & Triceps",
            "duration_min": 60,
            "exercises": [
                {"name": "Développé couché", "sets": 4, "reps": "8-10", "rest_sec": 90, "notes": "Contrôle la descente"}
            ],
        },
        "tuesday": {"type": "rest", "name": "Repos actif"},
    },
    "warm_up": ["5 min cardio léger", "Rotations des épaules"],
    "cool_down": ["Étirement quadriceps", "Étirement ischio-jambiers"],
    "progression": "Augmenter les charges de 2.5kg toutes les 2 semaines",
    "coach_tip": "Dormez 8h pour maximiser la récupération musculaire",
}

_QUICK_WORKOUT = {
    "workout_name": "HIIT Express",
    "type": "hiit",
    "duration_min": 20,
    "calories_estimated": 220,
    "phases": [
        {"phase": "échauffement", "duration_min": 3, "exercises": [{"name": "Jumping jacks", "duration_sec": 30}]}
    ],
}

_EXERCISES = [
    {
        "source": "Wger",
        "id": 192,
        "name": "Bench Press",
        "category": "Chest",
        "muscles": ["Pectoralis major"],
        "equipment": ["Barbell"],
    }
]


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
    mocker.patch("routes.training.get_db", return_value=db)
    return db


@pytest.fixture
def mock_postgres(mocker):
    mocker.patch("routes.training.get_user_profile", new_callable=AsyncMock, return_value=_USER)
    mocker.patch("routes.training.get_user_activity_entries", new_callable=AsyncMock, return_value=[])


@pytest.fixture
def mock_ollama_program(mocker):
    mocker.patch(
        "routes.training.ollama_service.generate_training_program",
        new_callable=AsyncMock,
        return_value=_PROGRAM,
    )


@pytest.fixture
def mock_ollama_quick(mocker):
    mocker.patch(
        "routes.training.ollama_service.generate_quick_workout",
        new_callable=AsyncMock,
        return_value=_QUICK_WORKOUT,
    )


@pytest.fixture
def mock_wger(mocker):
    mocker.patch(
        "routes.training.wger_service.get_exercises",
        new_callable=AsyncMock,
        return_value=_EXERCISES,
    )
