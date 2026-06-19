"""
Tests unitaires – API 2 Suggestions de Recettes
"""
import pytest
from unittest.mock import AsyncMock

pytestmark = pytest.mark.anyio


class TestSuggestRecipes:
    async def test_suggest_success(self, client, mock_postgres, mock_ollama_recipes, mock_db):
        resp = await client.get("/api/v2/recipes/suggest/user-123?meal_type=lunch")
        assert resp.status_code == 200
        data = resp.json()
        assert data["user_id"] == "user-123"
        assert data["meal_type"] == "lunch"
        assert "recipes" in data
        assert len(data["recipes"]["suggestions"]) == 1
        assert data["recipes"]["suggestions"][0]["name"] == "Poulet grillé aux légumes"

    async def test_suggest_missing_meal_type(self, client, mock_postgres):
        resp = await client.get("/api/v2/recipes/suggest/user-123")
        assert resp.status_code == 422

    async def test_suggest_invalid_meal_type(self, client, mock_postgres):
        resp = await client.get("/api/v2/recipes/suggest/user-123?meal_type=brunch")
        assert resp.status_code == 422

    async def test_suggest_all_meal_types(self, client, mock_postgres, mock_ollama_recipes, mock_db):
        for mt in ("breakfast", "lunch", "dinner", "snack"):
            resp = await client.get(f"/api/v2/recipes/suggest/user-123?meal_type={mt}")
            assert resp.status_code == 200, f"Échoué pour meal_type={mt}"

    async def test_suggest_user_not_found(self, client, mocker, mock_db):
        mocker.patch("routes.recipes.get_user_profile", new_callable=AsyncMock, return_value=None)
        resp = await client.get("/api/v2/recipes/suggest/unknown-user?meal_type=dinner")
        assert resp.status_code == 404

    async def test_suggest_ollama_error_returns_503(self, client, mock_postgres, mock_db, mocker):
        mocker.patch(
            "routes.recipes.ollama_service.generate_recipe_suggestions",
            side_effect=Exception("Ollama timeout"),
        )
        resp = await client.get("/api/v2/recipes/suggest/user-123?meal_type=breakfast")
        assert resp.status_code == 503

    async def test_suggest_logs_saved(self, client, mock_postgres, mock_ollama_recipes, mock_db):
        await client.get("/api/v2/recipes/suggest/user-123?meal_type=snack")
        mock_db["ailogs"].insert_one.assert_called_once()
        mock_db["recommendations"].insert_one.assert_called_once()


class TestGenerateFromIngredients:
    async def test_generate_success(self, client, mock_ollama_from_ingredients, mock_db):
        resp = await client.post(
            "/api/v2/recipes/generate",
            json={"user_id": "user-123", "ingredients": ["œufs", "épinards", "fromage"], "goal": "prise de muscle"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "recipe" in data
        assert data["recipe"]["name"] == "Omelette aux épinards"

    async def test_generate_empty_ingredients(self, client):
        resp = await client.post(
            "/api/v2/recipes/generate",
            json={"user_id": "user-123", "ingredients": []},
        )
        assert resp.status_code == 422

    async def test_generate_too_many_ingredients(self, client):
        resp = await client.post(
            "/api/v2/recipes/generate",
            json={"user_id": "user-123", "ingredients": [f"ing{i}" for i in range(21)]},
        )
        assert resp.status_code == 422

    async def test_generate_ollama_error(self, client, mock_db, mocker):
        mocker.patch(
            "routes.recipes.ollama_service.generate_recipe_from_ingredients",
            side_effect=Exception("Modèle non disponible"),
        )
        resp = await client.post(
            "/api/v2/recipes/generate",
            json={"user_id": "user-123", "ingredients": ["poulet", "riz"]},
        )
        assert resp.status_code == 503


class TestSearchRecipes:
    async def test_search_success(self, client, mocker):
        mocker.patch(
            "routes.recipes.themealdb_service.search_by_name",
            new_callable=AsyncMock,
            return_value=[{"source": "TheMealDB", "name": "Chicken Curry", "category": "Chicken"}],
        )
        resp = await client.get("/api/v2/recipes/search?query=chicken")
        assert resp.status_code == 200
        data = resp.json()
        assert data["query"] == "chicken"
        assert len(data["results"]) == 1
        assert data["source"] == "TheMealDB"

    async def test_search_too_short(self, client):
        resp = await client.get("/api/v2/recipes/search?query=c")
        assert resp.status_code == 422

    async def test_search_empty(self, client):
        resp = await client.get("/api/v2/recipes/search?query=")
        assert resp.status_code == 422


class TestByIngredient:
    async def test_by_ingredient_success(self, client, mocker):
        mocker.patch(
            "routes.recipes.themealdb_service.search_by_ingredient",
            new_callable=AsyncMock,
            return_value=[{"id": "123", "name": "Chicken Curry", "thumbnail": "http://..."}],
        )
        resp = await client.get("/api/v2/recipes/by-ingredient?ingredient=chicken")
        assert resp.status_code == 200
        assert len(resp.json()["results"]) == 1

    async def test_by_ingredient_missing(self, client):
        resp = await client.get("/api/v2/recipes/by-ingredient?ingredient=")
        assert resp.status_code == 422


class TestRandom:
    async def test_random_success(self, client, mocker):
        mocker.patch(
            "routes.recipes.themealdb_service.get_random_meal",
            new_callable=AsyncMock,
            return_value={"source": "TheMealDB", "name": "Beef Stew", "category": "Beef"},
        )
        resp = await client.get("/api/v2/recipes/random")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Beef Stew"

    async def test_random_unavailable(self, client, mocker):
        mocker.patch(
            "routes.recipes.themealdb_service.get_random_meal",
            new_callable=AsyncMock,
            return_value=None,
        )
        resp = await client.get("/api/v2/recipes/random")
        assert resp.status_code == 503


class TestHealth:
    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["port"] == 8002
