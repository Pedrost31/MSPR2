"""
Tests unitaires – API 3 Plan Diététique
"""
import pytest
from unittest.mock import AsyncMock

from services.tdee_calculator import compute_bmr, compute_tdee, compute_macros, get_full_macros

pytestmark = pytest.mark.anyio


# ─── Tests du calculateur TDEE (logique pure, sans mock) ──────────────────────

class TestTDEECalculator:
    def test_bmr_male(self):
        # Mifflin-St Jeor male: 10×80 + 6.25×180 - 5×30 + 5 = 1780
        bmr = compute_bmr(weight_kg=80, height_cm=180, age=30, gender="male")
        assert bmr == pytest.approx(1780, abs=1)

    def test_bmr_female(self):
        # Mifflin-St Jeor female: 10×65 + 6.25×168 - 5×28 - 161 = 1399
        bmr = compute_bmr(weight_kg=65, height_cm=168, age=28, gender="female")
        assert bmr == pytest.approx(1399, abs=1)

    def test_tdee_moderate(self):
        bmr = 1894.0
        tdee = compute_tdee(bmr, "moderate")
        assert tdee == pytest.approx(2935.7, abs=1)

    def test_tdee_sedentary(self):
        bmr = 1500.0
        tdee = compute_tdee(bmr, "sedentary")
        assert tdee == pytest.approx(1800.0, abs=1)

    def test_tdee_unknown_activity_defaults_to_moderate(self):
        bmr = 1500.0
        tdee = compute_tdee(bmr, "unknown_level")
        assert tdee == pytest.approx(2325.0, abs=1)

    def test_macros_lose_goal(self):
        macros = compute_macros(1800, weight_kg=65, goal="lose")
        assert macros["calories"] == 1800
        assert macros["protein_g"] == pytest.approx(65 * 1.6, abs=0.1)

    def test_macros_gain_goal(self):
        macros = compute_macros(2800, weight_kg=80, goal="gain")
        assert macros["protein_g"] == pytest.approx(80 * 2.0, abs=0.1)

    def test_macros_percentages_sum_to_100(self):
        macros = compute_macros(2000, weight_kg=70, goal="maintain")
        total = macros["protein_pct"] + macros["carbs_pct"] + macros["fat_pct"]
        assert total == pytest.approx(100, abs=1)

    def test_get_full_macros_complete_profile(self):
        user = {"weight": 75, "height": 175, "age": 25, "gender": "male", "activityLevel": "moderate", "goal": "maintain"}
        result = get_full_macros(user)
        assert result is not None
        assert "bmr" in result
        assert "tdee" in result
        assert "calories" in result

    def test_get_full_macros_incomplete_profile(self):
        user = {"weight": 75}
        result = get_full_macros(user)
        assert result is None


# ─── /macros/{user_id} ────────────────────────────────────────────────────────

class TestGetMacros:
    async def test_macros_success(self, client, mock_postgres, mock_macros):
        resp = await client.get("/api/v3/diet/macros/user-123")
        assert resp.status_code == 200
        data = resp.json()
        assert data["user_id"] == "user-123"
        assert "macros" in data
        assert data["macros"]["calories"] == 3570

    async def test_macros_user_not_found(self, client, mocker):
        mocker.patch("routes.diet.get_user_profile", new_callable=AsyncMock, return_value=None)
        resp = await client.get("/api/v3/diet/macros/unknown")
        assert resp.status_code == 404

    async def test_macros_incomplete_profile(self, client, mocker):
        mocker.patch("routes.diet.get_user_profile", new_callable=AsyncMock, return_value={"id": "user-123"})
        mocker.patch("routes.diet.get_full_macros", return_value=None)
        resp = await client.get("/api/v3/diet/macros/user-123")
        assert resp.status_code == 422


# ─── /plan/{user_id} ──────────────────────────────────────────────────────────

class TestGetDietPlan:
    async def test_plan_success(self, client, mock_postgres, mock_macros, mock_ollama_plan, mock_db):
        resp = await client.get("/api/v3/diet/plan/user-123")
        assert resp.status_code == 200
        data = resp.json()
        assert "plan" in data
        assert "macros" in data
        assert "weekly_plan" in data["plan"]
        assert "request_id" in data

    async def test_plan_user_not_found(self, client, mocker):
        mocker.patch("routes.diet.get_user_profile", new_callable=AsyncMock, return_value=None)
        resp = await client.get("/api/v3/diet/plan/unknown")
        assert resp.status_code == 404

    async def test_plan_incomplete_profile(self, client, mocker, mock_postgres):
        mocker.patch("routes.diet.get_full_macros", return_value=None)
        resp = await client.get("/api/v3/diet/plan/user-123")
        assert resp.status_code == 422

    async def test_plan_ollama_error(self, client, mock_postgres, mock_macros, mock_db, mocker):
        mocker.patch(
            "routes.diet.ollama_service.generate_diet_plan",
            side_effect=Exception("Timeout Ollama"),
        )
        resp = await client.get("/api/v3/diet/plan/user-123")
        assert resp.status_code == 503

    async def test_plan_saves_logs(self, client, mock_postgres, mock_macros, mock_ollama_plan, mock_db):
        await client.get("/api/v3/diet/plan/user-123")
        mock_db["ailogs"].insert_one.assert_called_once()
        mock_db["recommendations"].insert_one.assert_called_once()


# ─── /analyze/{user_id} ───────────────────────────────────────────────────────

class TestAnalyzeWeek:
    async def test_analyze_success(self, client, mock_postgres, mock_macros, mock_db, mocker):
        mocker.patch(
            "routes.diet.ollama_service.analyze_nutritional_balance",
            new_callable=AsyncMock,
            return_value={
                "period_days": 7,
                "averages": {"calories": 2100},
                "ai_analysis": {"score": 75, "status": "bon"},
            },
        )
        resp = await client.get("/api/v3/diet/analyze/user-123?days=7")
        assert resp.status_code == 200
        assert "analysis" in resp.json()

    async def test_analyze_invalid_days(self, client, mock_postgres, mock_macros):
        resp = await client.get("/api/v3/diet/analyze/user-123?days=0")
        assert resp.status_code == 422

    async def test_analyze_days_too_large(self, client, mock_postgres, mock_macros):
        resp = await client.get("/api/v3/diet/analyze/user-123?days=31")
        assert resp.status_code == 422


class TestHealth:
    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["port"] == 8003
