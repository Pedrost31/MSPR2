"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const password = await bcryptjs_1.default.hash('Demo1234!', 12);
    const user = await prisma.user.upsert({
        where: { email: 'demo@healthai.com' },
        update: {},
        create: {
            email: 'demo@healthai.com',
            password,
            name: 'Utilisateur Démo',
            age: 30,
            weight: 75,
            height: 175,
            gender: 'male',
            activityLevel: 'moderate',
            goal: 'maintain',
            dailyCalorieTarget: 2200,
            goalSettings: {
                create: {
                    dailyCalorieTarget: 2200,
                    dailyProteinTarget: 165,
                    dailyCarbsTarget: 275,
                    dailyFatTarget: 73,
                    weeklyWorkoutTarget: 4,
                    targetWeight: 74,
                },
            },
        },
    });
    await prisma.foodEntry.createMany({
        data: [
            { userId: user.id, name: 'Flocons d\'avoine', calories: 350, protein: 12, carbs: 60, fat: 6, mealType: 'breakfast' },
            { userId: user.id, name: 'Poulet grillé + riz', calories: 550, protein: 45, carbs: 60, fat: 8, mealType: 'lunch' },
            { userId: user.id, name: 'Salade César', calories: 320, protein: 20, carbs: 15, fat: 22, mealType: 'dinner' },
            { userId: user.id, name: 'Yaourt grec', calories: 130, protein: 15, carbs: 10, fat: 3, mealType: 'snack' },
        ],
        skipDuplicates: true,
    });
    await prisma.activityEntry.createMany({
        data: [
            { userId: user.id, name: 'Course à pied', duration: 30, caloriesBurned: 300, type: 'cardio' },
            { userId: user.id, name: 'Musculation', duration: 45, caloriesBurned: 250, type: 'strength' },
        ],
        skipDuplicates: true,
    });
    console.log(`Seed OK — compte démo : demo@healthai.com / Demo1234!`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map