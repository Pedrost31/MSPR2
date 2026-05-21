export type MessageRole = "user" | "assistant";

export interface NutritionData {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
  label: string;
}

export interface WorkoutRecommendation {
  name: string;
  duration: string;
  intensity: "low" | "medium" | "high";
  category: string;
}

export interface HealthMetrics {
  bmi?: number;
  weight?: number;
  height?: number;
  age?: number;
  goal?: string;
}

export interface StructuredData {
  type: "nutrition" | "workout" | "metrics" | "plan";
  data: NutritionData | WorkoutRecommendation[] | HealthMetrics | string[];
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  structuredData?: StructuredData;
}

export interface UserProfile {
  age?: number;
  weight?: number;
  height?: number;
  goal?: "weight_loss" | "muscle_gain" | "endurance" | "health";
  activityLevel?: "sedentary" | "light" | "moderate" | "active";
  allergies?: string[];
  equipment?: "none" | "home" | "gym";
}
