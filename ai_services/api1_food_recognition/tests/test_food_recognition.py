"""
Tests unitaires – API 1 Reconnaissance Alimentaire
Toutes les dépendances externes (Ollama, Open Food Facts, USDA, MongoDB) sont mockées.
"""
import pytest
from unittest.mock import AsyncMock

pytestmark = pytest.mark.anyio


# ─── /analyze-image ───────────────────────────────────────────────────────────

class TestAnalyzeImage:
    async def test_success(self, client, mock_ollama, mock_db):
        resp = await client.post(
            "/api/v1/food/analyze-image",
            json={"image_base64": "aW1hZ2VkYXRh", "user_id": "user-123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["analysis"]["food_name"] == "Pomme"
        assert "request_id" in data
        assert "latency_ms" in data

    async def test_empty_base64_rejected(self, client):
        resp = await client.post(
            "/api/v1/food/analyze-image",
            json={"image_base64": "", "user_id": "user-123"},
        )
        assert resp.status_code == 422

    async def test_invalid_base64_rejected(self, client):
        resp = await client.post(
            "/api/v1/food/analyze-image",
            json={"image_base64": "!!!not-valid-base64!!!", "user_id": "user-123"},
        )
        assert resp.status_code == 422

    async def test_missing_user_id(self, client):
        resp = await client.post(
            "/api/v1/food/analyze-image",
            json={"image_base64": "aW1hZ2VkYXRh"},
        )
        assert resp.status_code == 422

    async def test_ollama_error_returns_503(self, client, mock_db, mocker):
        mocker.patch(
            "routes.food_recognition.ollama_service.analyze_food_image",
            side_effect=Exception("Ollama non disponible"),
        )
        resp = await client.post(
            "/api/v1/food/analyze-image",
            json={"image_base64": "aW1hZ2VkYXRh", "user_id": "user-123"},
        )
        assert resp.status_code == 503
        assert "Ollama" in resp.json()["detail"]

    async def test_logs_saved_on_success(self, client, mock_ollama, mock_db):
        await client.post(
            "/api/v1/food/analyze-image",
            json={"image_base64": "aW1hZ2VkYXRh", "user_id": "user-123"},
        )
        mock_db["ailogs"].insert_one.assert_called_once()
        mock_db["recommendations"].insert_one.assert_called_once()

    async def test_error_log_saved_on_failure(self, client, mock_db, mocker):
        mocker.patch(
            "routes.food_recognition.ollama_service.analyze_food_image",
            side_effect=Exception("timeout"),
        )
        await client.post(
            "/api/v1/food/analyze-image",
            json={"image_base64": "aW1hZ2VkYXRh", "user_id": "user-123"},
        )
        call_args = mock_db["ailogs"].insert_one.call_args[0][0]
        assert call_args["status"] == "error"


# ─── /search ──────────────────────────────────────────────────────────────────

class TestSearchFood:
    async def test_search_all_sources(self, client, mocker):
        mocker.patch(
            "routes.food_recognition.openfoodfacts_service.search_food",
            new_callable=AsyncMock,
            return_value=[{"source": "Open Food Facts", "name": "Apple"}],
        )
        mocker.patch(
            "routes.food_recognition.usda_service.search_food_usda",
            new_callable=AsyncMock,
            return_value=[{"source": "USDA FoodData Central", "name": "Apple, Raw"}],
        )
        resp = await client.get("/api/v1/food/search?query=apple")
        assert resp.status_code == 200
        data = resp.json()
        assert data["query"] == "apple"
        assert len(data["results"]) == 2
        assert "Open Food Facts" in data["sources"]
        assert "USDA FoodData Central" in data["sources"]

    async def test_search_single_source(self, client, mocker):
        mocker.patch(
            "routes.food_recognition.openfoodfacts_service.search_food",
            new_callable=AsyncMock,
            return_value=[{"source": "Open Food Facts", "name": "Banana"}],
        )
        resp = await client.get("/api/v1/food/search?query=banana&sources=openfoodfacts")
        assert resp.status_code == 200
        assert len(resp.json()["results"]) == 1

    async def test_query_too_short(self, client):
        resp = await client.get("/api/v1/food/search?query=a")
        assert resp.status_code == 422

    async def test_empty_query(self, client):
        resp = await client.get("/api/v1/food/search?query=")
        assert resp.status_code == 422


# ─── /barcode/{barcode} ───────────────────────────────────────────────────────

class TestBarcode:
    async def test_valid_barcode(self, client, mocker):
        mocker.patch(
            "routes.food_recognition.openfoodfacts_service.get_product_by_barcode",
            new_callable=AsyncMock,
            return_value={"name": "Nutella", "nutrition_per_100g": {"calories": 530}},
        )
        resp = await client.get("/api/v1/food/barcode/3017620422003")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Nutella"

    async def test_non_numeric_barcode(self, client):
        resp = await client.get("/api/v1/food/barcode/ABC123")
        assert resp.status_code == 422

    async def test_barcode_not_found(self, client, mocker):
        mocker.patch(
            "routes.food_recognition.openfoodfacts_service.get_product_by_barcode",
            new_callable=AsyncMock,
            return_value=None,
        )
        resp = await client.get("/api/v1/food/barcode/9999999999999")
        assert resp.status_code == 404


# ─── /health ──────────────────────────────────────────────────────────────────

class TestHealth:
    async def test_health_check(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
        assert resp.json()["port"] == 8001
