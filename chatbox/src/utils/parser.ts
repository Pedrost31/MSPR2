import type { StructuredData, NutritionData, WorkoutRecommendation } from "../types";

export function extractStructuredData(text: string): StructuredData | undefined {
  // Detect nutrition JSON blocks
  const nutritionMatch = text.match(/```json:nutrition\n([\s\S]*?)```/);
  if (nutritionMatch) {
    try {
      const data = JSON.parse(nutritionMatch[1]) as NutritionData;
      return { type: "nutrition", data };
    } catch {}
  }

  // Detect workout JSON blocks
  const workoutMatch = text.match(/```json:workout\n([\s\S]*?)```/);
  if (workoutMatch) {
    try {
      const data = JSON.parse(workoutMatch[1]) as WorkoutRecommendation[];
      return { type: "workout", data };
    } catch {}
  }

  // Detect meal plan blocks
  const planMatch = text.match(/```json:plan\n([\s\S]*?)```/);
  if (planMatch) {
    try {
      const data = JSON.parse(planMatch[1]) as string[];
      return { type: "plan", data };
    } catch {}
  }

  return undefined;
}

export function cleanMarkdown(text: string): string {
  return text
    .replace(/```json:(nutrition|workout|plan)\n[\s\S]*?```/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .trim();
}

export function getBMI(weight: number, height: number): number {
  const h = height / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Sous-poids";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Surpoids";
  return "Obésité";
}
