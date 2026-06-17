import { UpdateGoalInput } from '../schemas/goal.schema';
export declare const getGoals: (userId: string) => Promise<{
    userId: string;
    id: string;
    dailyCalorieTarget: number;
    createdAt: Date;
    updatedAt: Date;
    dailyProteinTarget: number | null;
    dailyCarbsTarget: number | null;
    dailyFatTarget: number | null;
    weeklyWorkoutTarget: number;
    targetWeight: number | null;
}>;
export declare const updateGoals: (userId: string, input: UpdateGoalInput) => Promise<{
    userId: string;
    id: string;
    dailyCalorieTarget: number;
    createdAt: Date;
    updatedAt: Date;
    dailyProteinTarget: number | null;
    dailyCarbsTarget: number | null;
    dailyFatTarget: number | null;
    weeklyWorkoutTarget: number;
    targetWeight: number | null;
}>;
