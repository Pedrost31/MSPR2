import type { ActivityEntry } from "../types";
import { api } from "./api";
import { mapActivityEntryFromApi } from "./mappers";

export const activityService = {
  async list(): Promise<ActivityEntry[]> {
    const { data } = await api.get("/activities", { params: { limit: 200 } });
    return data.data.entries.map(mapActivityEntryFromApi);
  },

  async create(formData: {
    name: string;
    duration: number;
    calories: number;
  }): Promise<ActivityEntry> {
    const { data } = await api.post("/activities", {
      name: formData.name,
      duration: formData.duration,
      caloriesBurned: formData.calories,
    });
    return mapActivityEntryFromApi(data.data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/activities/${id}`);
  },
};
