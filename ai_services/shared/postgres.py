"""
Connexion PostgreSQL partagée – lit le même schéma Prisma que le backend Node.js.
Tables : "User", "FoodEntry", "ActivityEntry", "GoalSettings"
"""
import os
from typing import Optional
import asyncpg

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:55432/healthai")


async def get_user_profile(user_id: str) -> Optional[dict]:
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        row = await conn.fetchrow(
            '''SELECT id, email, name, age, weight, height, gender,
               "activityLevel", goal, "dailyCalorieTarget"
               FROM "User" WHERE id = $1''',
            user_id,
        )
        return dict(row) if row else None
    finally:
        await conn.close()


async def get_user_food_entries(user_id: str, days: int = 7) -> list[dict]:
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch(
            '''SELECT name, calories, protein, carbs, fat, fiber, "mealType", date
               FROM "FoodEntry"
               WHERE "userId" = $1
                 AND date >= NOW() - ($2 || ' days')::INTERVAL
               ORDER BY date DESC''',
            user_id,
            str(days),
        )
        return [dict(r) for r in rows]
    finally:
        await conn.close()


async def get_user_activity_entries(user_id: str, days: int = 7) -> list[dict]:
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        rows = await conn.fetch(
            '''SELECT name, duration, "caloriesBurned", type, date
               FROM "ActivityEntry"
               WHERE "userId" = $1
                 AND date >= NOW() - ($2 || ' days')::INTERVAL
               ORDER BY date DESC''',
            user_id,
            str(days),
        )
        return [dict(r) for r in rows]
    finally:
        await conn.close()


async def get_user_goal_settings(user_id: str) -> Optional[dict]:
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        row = await conn.fetchrow(
            '''SELECT "dailyCalorieTarget", "dailyProteinTarget", "dailyCarbsTarget",
               "dailyFatTarget", "weeklyWorkoutTarget", "targetWeight"
               FROM "GoalSettings" WHERE "userId" = $1''',
            user_id,
        )
        return dict(row) if row else None
    finally:
        await conn.close()
