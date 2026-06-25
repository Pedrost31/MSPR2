import { CoffeeIcon, CookieIcon, MoonIcon, SunIcon } from "lucide-react";
import type { UserData, FoodEntry, ActivityEntry } from "../types";

export const dummyUser: UserData & { id: string; email: string; username: string } = {
    id: "user_123",
    username: "DemoUser",
    name: "Demo User",
    email: "demo@example.com",
    age: 30,
    weight: 75,
    height: 175,
    goal: "maintain",
    dailyCalorieIntake: 2200,
    dailyCalorieBurn: 400,
    createdAt: new Date().toISOString(),
};

export const dummyFoodLogs: FoodEntry[] = [
    {
        id: "food_1",
        documentId: "doc_food_1",
        name: "Oatmeal with Blueberries",
        calories: 300,
        mealType: "breakfast",
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
    },
    {
        id: "food_2",
        documentId: "doc_food_2",
        name: "Grilled Chicken Salad",
        calories: 450,
        mealType: "lunch",
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
    },
];

export const dummyActivityLogs: ActivityEntry[] = [
    {
        id: 1,
        documentId: "doc_act_1",
        name: "Morning Run",
        duration: 30,
        calories: 300,
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
    },
];

export const quickActivities = [
    { name: "Marche", emoji: "🚶", rate: 5 },
    { name: "Course", emoji: "🏃", rate: 11 },
    { name: "Vélo", emoji: "🚴", rate: 8 },
    { name: "Natation", emoji: "🏊", rate: 10 },
    { name: "Yoga", emoji: "🧘", rate: 4 },
    { name: "Musculation", emoji: "🏋️", rate: 6 },
];

export const mealTypeOptions = [
    { value: "breakfast", label: "🌅 Petit-déjeuner" },
    { value: "lunch", label: "☀️ Déjeuner" },
    { value: "dinner", label: "🌙 Dîner" },
    { value: "snack", label: "🍪 Collation" },
];

export const mealLabels: Record<"breakfast" | "lunch" | "dinner" | "snack", string> = {
    breakfast: "Petit-déjeuner",
    lunch: "Déjeuner",
    dinner: "Dîner",
    snack: "Collation",
};

export const quickActivitiesFoodLog = [
    { name: "breakfast", label: "Petit-déjeuner", emoji: "🌮" },
    { name: "lunch", label: "Déjeuner", emoji: "🌅" },
    { name: "dinner", label: "Dîner", emoji: "🌙" },
    { name: "snack", label: "Collation", emoji: "🍪" },
];

export const mealColors = {
    breakfast: "bg-amber-100 text-amber-600",
    lunch: "bg-orange-100 text-orange-600",
    dinner: "bg-indigo-100 text-indigo-600",
    snack: "bg-pink-100 text-pink-600",
};

export const mealIcons = {
    breakfast: CoffeeIcon,
    lunch: SunIcon,
    dinner: MoonIcon,
    snack: CookieIcon,
};

export const goalOptions = [
    { value: "lose", label: "Perdre du poids" },
    { value: "maintain", label: "Maintenir le poids" },
    { value: "gain", label: "Prendre du muscle" },
];

export const goalLabels = {
    lose: "Perdre du poids",
    maintain: "Maintenir le poids",
    gain: "Prendre du muscle",
};

export const ageRanges = [
    { max: 15, maintain: 2500, burn: 600 },
    { max: 18, maintain: 2550, burn: 600 },
    { max: 21, maintain: 2500, burn: 550 },
    { max: 24, maintain: 2450, burn: 550 },
    { max: 27, maintain: 2400, burn: 525 },
    { max: 30, maintain: 2350, burn: 500 },
    { max: 33, maintain: 2300, burn: 475 },
    { max: 36, maintain: 2250, burn: 475 },
    { max: 39, maintain: 2200, burn: 450 },
    { max: 42, maintain: 2150, burn: 450 },
    { max: 45, maintain: 2100, burn: 425 },
    { max: 48, maintain: 2050, burn: 425 },
    { max: 51, maintain: 2000, burn: 400 },
    { max: 54, maintain: 1950, burn: 400 },
    { max: 57, maintain: 1900, burn: 375 },
    { max: 60, maintain: 1850, burn: 375 },
    { max: 63, maintain: 1800, burn: 350 },
    { max: 66, maintain: 1750, burn: 350 },
    { max: 69, maintain: 1700, burn: 325 },
    { max: 72, maintain: 1650, burn: 325 },
    { max: 75, maintain: 1600, burn: 300 },
    { max: 120, maintain: 1500, burn: 300 },
];

export const getMotivationalMessage = (caloriesConsumed: number, activeMinutes: number, DAILY_CALORIE_LIMIT: number) => {
    const percentage = (caloriesConsumed / DAILY_CALORIE_LIMIT) * 100;

    if (caloriesConsumed === 0 && activeMinutes === 0) {
        return { text: "Prêt à tout déchirer aujourd'hui ? Commencez à enregistrer !", emoji: "💪" };
    }
    if (percentage > 100) {
        return { text: "Limite dépassée, mais demain est un nouveau jour !", emoji: "🌅" };
    }
    if (percentage >= 80) {
        return { text: "Presque à votre limite, restez attentif !", emoji: "⚡" };
    }
    if (activeMinutes >= 30) {
        return { text: "Belle séance aujourd'hui ! Continuez comme ça !", emoji: "🔥" };
    }
    if (percentage >= 50) {
        return { text: "Vous vous débrouillez très bien, continuez !", emoji: "✨" };
    }
    return { text: "Chaque pas compte. Vous allez y arriver !", emoji: "🚀" };
};
