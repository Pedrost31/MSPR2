"""
Tests unitaires – API 4 Programmes d'Entraînement
"""
import pytest
from unittest.mock import AsyncMock

pytestmark = pytest.mark.anyio


# ─── /program/{user_id} ───────────────────────────────────────────────────────

class TestGetTrainingProgram:
    async def test_program_success(self, client, mock_postgres, mock_ollama_program, mock_db):
        resp = await client.get("/api/v4/training/program/user-123")
        assert resp.status_code == 200
        data = resp.json()
        assert data["user_id"] == "user-123"
        assert "program" in data
        assert data["program"]["program_name"] == "Programme Prise de Masse"
        assert data["program"]["weekly_sessions"] == 5
        assert "request_id" in data

    async def test_program_user_not_found(self, client, mocker, mock_db):
        mocker.patch("routes.training.get_user_profile", new_callable=AsyncMock, return_value=None)
        resp = await client.get("/api/v4/training/program/unknown-user")
        assert resp.status_code == 404
        assert "introuvable" in resp.json()["detail"]

    async def test_program_ollama_error(self, client, mock_postgres, mock_db, mocker):
        mocker.patch(
            "routes.training.ollama_service.generate_training_program",
            side_effect=Exception("Modèle non disponible"),
        )
        resp = await client.get("/api/v4/training/program/user-123")
        assert resp.status_code == 503

    async def test_program_saves_ai_log(self, client, mock_postgres, mock_ollama_program, mock_db):
        await client.get("/api/v4/training/program/user-123")
        mock_db["ailogs"].insert_one.assert_called_once()
        log_doc = mock_db["ailogs"].insert_one.call_args[0][0]
        assert log_doc["service"] == "training-program"
        assert log_doc["status"] == "success"

    async def test_program_saves_recommendation(self, client, mock_postgres, mock_ollama_program, mock_db):
        await client.get("/api/v4/training/program/user-123")
        mock_db["recommendations"].insert_one.assert_called_once()
        rec_doc = mock_db["recommendations"].insert_one.call_args[0][0]
        assert rec_doc["type"] == "activity"

    async def test_program_error_log_saved_on_failure(self, client, mock_postgres, mock_db, mocker):
        mocker.patch(
            "routes.training.ollama_service.generate_training_program",
            side_effect=Exception("Erreur"),
        )
        await client.get("/api/v4/training/program/user-123")
        log_doc = mock_db["ailogs"].insert_one.call_args[0][0]
        assert log_doc["status"] == "error"
        assert "error" in log_doc


# ─── /quick-workout ───────────────────────────────────────────────────────────

class TestQuickWorkout:
    async def test_quick_workout_success(self, client, mock_ollama_quick):
        resp = await client.post(
            "/api/v4/training/quick-workout",
            json={"workout_type": "hiit", "duration_min": 20, "equipment": []},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "workout" in data
        assert data["workout"]["type"] == "hiit"

    async def test_quick_workout_default_values(self, client, mock_ollama_quick):
        resp = await client.post("/api/v4/training/quick-workout", json={})
        assert resp.status_code == 200

    async def test_invalid_workout_type(self, client):
        resp = await client.post(
            "/api/v4/training/quick-workout",
            json={"workout_type": "invalid_type", "duration_min": 30},
        )
        assert resp.status_code == 422

    async def test_duration_too_short(self, client):
        resp = await client.post(
            "/api/v4/training/quick-workout",
            json={"workout_type": "cardio", "duration_min": 5},
        )
        assert resp.status_code == 422

    async def test_duration_too_long(self, client):
        resp = await client.post(
            "/api/v4/training/quick-workout",
            json={"workout_type": "cardio", "duration_min": 200},
        )
        assert resp.status_code == 422

    async def test_ollama_error_returns_503(self, client, mocker):
        mocker.patch(
            "routes.training.ollama_service.generate_quick_workout",
            side_effect=Exception("Ollama down"),
        )
        resp = await client.post(
            "/api/v4/training/quick-workout",
            json={"workout_type": "cardio", "duration_min": 30},
        )
        assert resp.status_code == 503


# ─── /exercises ───────────────────────────────────────────────────────────────

class TestGetExercises:
    async def test_exercises_success(self, client, mock_wger):
        resp = await client.get("/api/v4/training/exercises")
        assert resp.status_code == 200
        data = resp.json()
        assert "results" in data
        assert data["count"] == 1
        assert data["source"] == "Wger"

    async def test_exercises_with_muscle_filter(self, client, mock_wger):
        resp = await client.get("/api/v4/training/exercises?muscle=chest")
        assert resp.status_code == 200

    async def test_exercises_with_equipment_filter(self, client, mock_wger):
        resp = await client.get("/api/v4/training/exercises?equipment=dumbbell")
        assert resp.status_code == 200

    async def test_exercises_invalid_limit_zero(self, client):
        resp = await client.get("/api/v4/training/exercises?limit=0")
        assert resp.status_code == 422

    async def test_exercises_limit_too_large(self, client):
        resp = await client.get("/api/v4/training/exercises?limit=51")
        assert resp.status_code == 422


# ─── /exercises/{id} ──────────────────────────────────────────────────────────

class TestGetExerciseDetail:
    async def test_exercise_found(self, client, mocker):
        mocker.patch(
            "routes.training.wger_service.get_exercise_by_id",
            new_callable=AsyncMock,
            return_value={"source": "Wger", "id": 192, "name": "Bench Press", "category": "Chest"},
        )
        resp = await client.get("/api/v4/training/exercises/192")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Bench Press"

    async def test_exercise_not_found(self, client, mocker):
        mocker.patch(
            "routes.training.wger_service.get_exercise_by_id",
            new_callable=AsyncMock,
            return_value=None,
        )
        resp = await client.get("/api/v4/training/exercises/99999")
        assert resp.status_code == 404


# ─── /health ──────────────────────────────────────────────────────────────────

class TestHealth:
    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["port"] == 8004
        assert resp.json()["service"] == "training-program"
