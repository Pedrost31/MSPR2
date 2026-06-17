import { RegisterInput, LoginInput } from '../schemas/auth.schema';
export declare const register: (input: RegisterInput) => Promise<{
    user: {
        email: string;
        name: string;
        age: number | null;
        weight: number | null;
        height: number | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        activityLevel: import(".prisma/client").$Enums.ActivityLevel | null;
        goal: import(".prisma/client").$Enums.Goal | null;
        id: string;
        dailyCalorieTarget: number | null;
        createdAt: Date;
    };
    accessToken: string;
    refreshToken: string;
}>;
export declare const login: (input: LoginInput) => Promise<{
    user: {
        email: string;
        name: string;
        age: number | null;
        weight: number | null;
        height: number | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        activityLevel: import(".prisma/client").$Enums.ActivityLevel | null;
        goal: import(".prisma/client").$Enums.Goal | null;
        id: string;
        role: import(".prisma/client").$Enums.Role;
        avatarUrl: string | null;
        dailyCalorieTarget: number | null;
        createdAt: Date;
        updatedAt: Date;
    };
    accessToken: string;
    refreshToken: string;
}>;
export declare const refreshTokens: (token: string) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export declare const logout: (token: string) => Promise<void>;
