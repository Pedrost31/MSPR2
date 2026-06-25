import type { User } from "../types";
import { api } from "./api";
import { mapUserFromApi } from "./mappers";

export const userService = {
  async getMe(token?: string): Promise<NonNullable<User>> {
    const { data } = await api.get("/users/me", {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const storedToken = token ?? localStorage.getItem("token") ?? "";
    return mapUserFromApi(data.data, storedToken);
  },

  async updateProfile(updates: {
    age?: number;
    weight?: number;
    height?: number;
    goal?: "lose" | "maintain" | "gain";
    dailyCalorieTarget?: number;
    gender?: string;
    activityLevel?: string;
  }): Promise<NonNullable<User>> {
    const { data } = await api.put("/users/me", updates);
    const token = localStorage.getItem("token") ?? "";
    return mapUserFromApi(data.data, token);
  },

  async deleteAccount(): Promise<void> {
    await api.delete("/users/me");
  },
};
