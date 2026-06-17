"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const database_1 = require("../config/database");
const TEST_EMAIL = 'food-test@healthai.test';
const TEST_PWD = 'Password123!';
let token;
let entryId;
beforeAll(async () => {
    await database_1.prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    const res = await (0, supertest_1.default)(app_1.default)
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PWD, name: 'Food Tester' });
    token = res.body.data.accessToken;
});
afterAll(async () => {
    await database_1.prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await database_1.prisma.$disconnect();
});
const auth = () => ({ Authorization: `Bearer ${token}` });
describe('POST /api/food-entries', () => {
    it('crée une entrée alimentaire', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/food-entries')
            .set(auth())
            .send({ name: 'Pomme', calories: 95, protein: 0.5, carbs: 25, mealType: 'snack' });
        expect(res.status).toBe(201);
        expect(res.body.data.name).toBe('Pomme');
        expect(res.body.data.calories).toBe(95);
        entryId = res.body.data.id;
    });
    it('retourne 422 sans champs requis', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .post('/api/food-entries')
            .set(auth())
            .send({ name: 'Oubli' });
        expect(res.status).toBe(422);
    });
});
describe('GET /api/food-entries', () => {
    it('liste les entrées avec pagination', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/food-entries?page=1&limit=10')
            .set(auth());
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('entries');
        expect(res.body.data).toHaveProperty('total');
        expect(Array.isArray(res.body.data.entries)).toBe(true);
    });
    it('filtre par mealType', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/food-entries?mealType=snack')
            .set(auth());
        expect(res.status).toBe(200);
        res.body.data.entries.forEach((e) => expect(e.mealType).toBe('snack'));
    });
});
describe('GET /api/food-entries/daily-summary', () => {
    it('retourne le résumé nutritionnel du jour', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/food-entries/daily-summary')
            .set(auth());
        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('totalCalories');
        expect(res.body.data).toHaveProperty('byMealType');
    });
});
describe('GET /api/food-entries/:id', () => {
    it('retourne une entrée par id', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get(`/api/food-entries/${entryId}`)
            .set(auth());
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(entryId);
    });
    it('retourne 404 pour un id inexistant', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .get('/api/food-entries/00000000-0000-0000-0000-000000000000')
            .set(auth());
        expect(res.status).toBe(404);
    });
});
describe('PUT /api/food-entries/:id', () => {
    it('met à jour les calories', async () => {
        const res = await (0, supertest_1.default)(app_1.default)
            .put(`/api/food-entries/${entryId}`)
            .set(auth())
            .send({ calories: 110 });
        expect(res.status).toBe(200);
        expect(res.body.data.calories).toBe(110);
    });
});
describe('DELETE /api/food-entries/:id', () => {
    it('supprime l\'entrée', async () => {
        const del = await (0, supertest_1.default)(app_1.default)
            .delete(`/api/food-entries/${entryId}`)
            .set(auth());
        expect(del.status).toBe(200);
        const get = await (0, supertest_1.default)(app_1.default)
            .get(`/api/food-entries/${entryId}`)
            .set(auth());
        expect(get.status).toBe(404);
    });
});
//# sourceMappingURL=food.test.js.map