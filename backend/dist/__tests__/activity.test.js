"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const database_1 = require("../config/database");
const TEST_EMAIL = 'activity-test@healthai.test';
const TEST_PWD = 'Password123!';
let token;
let activityId;
beforeAll(async () => {
    await database_1.prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    const res = await (0, supertest_1.default)(app_1.default)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PWD, name: 'Activity Tester' });
    token = res.body.data.accessToken;
});
afterAll(async () => {
    await database_1.prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await database_1.prisma.$disconnect();
});
const auth = () => ({ Authorization: `Bearer ${token}` });
describe('POST /api/activities', () => {
    it('crée une activité', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/activities')
            .set(auth())
            .send({ name: 'Course à pied', duration: 30, caloriesBurned: 300, type: 'cardio' });
        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe('Course à pied');
        expect(res.body.data.type).toBe('cardio');
        activityId = res.body.data.id;
    });
    it('retourne 422 sans durée', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/activities')
            .set(auth())
            .send({ name: 'Yoga', caloriesBurned: 100 });
        expect(res.status).toBe(422);
    });
});
describe('GET /api/activities', () => {
    it('liste les activités', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/activities').set(auth());
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('entries');
        expect(res.body.data.entries.length).toBeGreaterThan(0);
    });
    it('filtre par type', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/activities?type=cardio').set(auth());
        expect(res.status).toBe(200);
        res.body.data.entries.forEach((a) => expect(a.type).toBe('cardio'));
    });
});
describe('GET /api/activities/weekly-summary', () => {
    it('retourne le résumé de la semaine', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/activities/weekly-summary').set(auth());
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('totalCaloriesBurned');
        expect(res.body.data).toHaveProperty('sessionCount');
        expect(res.body.data.sessionCount).toBeGreaterThan(0);
    });
});
describe('PUT /api/activities/:id', () => {
    it('met à jour la durée', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .put(`/api/activities/${activityId}`)
            .set(auth())
            .send({ duration: 45 });
        expect(res.status).toBe(200);
        expect(res.body.data.duration).toBe(45);
    });
});
describe('DELETE /api/activities/:id', () => {
    it('supprime l\'activité', async () => {
        const del = await (0, supertest_1.default)(app_1.default).delete(`/api/activities/${activityId}`).set(auth());
        expect(del.status).toBe(200);
        const get = await (0, supertest_1.default)(app_1.default).get(`/api/activities/${activityId}`).set(auth());
        expect(get.status).toBe(404);
    });
});
describe('GET /api/goals', () => {
    it('crée les objectifs par défaut si absents', async () => {
        const res = await (0, supertest_1.default)(app_1.default).get('/api/goals').set(auth());
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('dailyCalorieTarget');
        expect(res.body.data).toHaveProperty('weeklyWorkoutTarget');
    });
    it('met à jour les objectifs', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .put('/api/goals')
            .set(auth())
            .send({ dailyCalorieTarget: 2500, weeklyWorkoutTarget: 5 });
        expect(res.status).toBe(200);
        expect(res.body.data.dailyCalorieTarget).toBe(2500);
    });
});
//# sourceMappingURL=activity.test.js.map