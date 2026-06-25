import type { FoodEntry, FormData } from "../types";
import { api } from "./api";
import { mapFoodEntryFromApi } from "./mappers";

export const foodService = {
  async list(): Promise<FoodEntry[]> {
    const { data } = await api.get("/food-entries", { params: { limit: 200 } });
    return data.data.entries.map(mapFoodEntryFromApi);
  },

  async create(formData: FormData): Promise<FoodEntry> {
    const { data } = await api.post("/food-entries", {
      name: formData.name,
      calories: formData.calories,
      mealType: formData.mealType,
    });
    return mapFoodEntryFromApi(data.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/food-entries/${id}`);
  },
};
