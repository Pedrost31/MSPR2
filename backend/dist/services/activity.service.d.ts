import { CreateActivityInput, UpdateActivityInput } from '../schemas/activity.schema';
export declare const createActivity: (userId: string, input: CreateActivityInput) => Promise<{
    userId: string;
    name: string;
    type: import(".prisma/client").$Enums.ActivityType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    date: Date;
    duration: number;
    caloriesBurned: number;
}>;
interface ActivityFilters {
    startDate?: string;
    endDate?: string;
    type?: string;
    page?: number;
    limit?: number;
}
export declare const getActivities: (userId: string, filters: ActivityFilters) => Promise<{
    entries: {
        userId: string;
        name: string;
        type: import(".prisma/client").$Enums.ActivityType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        duration: number;
        caloriesBurned: number;
    }[];
    total: number;
    page: number;
    limit: number;
    pages: number;
}>;
export declare const getActivityById: (id: string, userId: string) => Promise<{
    userId: string;
    name: string;
    type: import(".prisma/client").$Enums.ActivityType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    date: Date;
    duration: number;
    caloriesBurned: number;
}>;
export declare const updateActivity: (id: string, userId: string, input: UpdateActivityInput) => Promise<{
    userId: string;
    name: string;
    type: import(".prisma/client").$Enums.ActivityType;
    id: string;
    createdAt: Date;
    updatedAt: Date;
    date: Date;
    duration: number;
    caloriesBurned: number;
}>;
export declare const deleteActivity: (id: string, userId: string) => Promise<void>;
export declare const getWeeklyActivitySummary: (userId: string) => Promise<{
    weekStart: string;
    totalCaloriesBurned: number;
    totalDurationMinutes: number;
    sessionCount: number;
    activities: {
        userId: string;
        name: string;
        type: import(".prisma/client").$Enums.ActivityType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        duration: number;
        caloriesBurned: number;
    }[];
}>;
export {};
