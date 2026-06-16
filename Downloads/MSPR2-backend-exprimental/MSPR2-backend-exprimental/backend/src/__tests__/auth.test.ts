import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database';

const TEST_EMAIL = 'auth-test@healthai.test';
const TEST_PWD   = 'Password123!';

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('crée un utilisateur et retourne des tokens', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PWD, name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.email).toBe(TEST_EMAIL);
    expect(res.body.data.user).not.toHaveProperty('password');
  });

  it('retourne 409 si l\'email est déjà pris', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PWD, name: 'Dup' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('retourne 422 pour des données invalides', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'pas-un-email', password: '123' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});

describe('POST /api/auth/login', () => {
  it('connecte avec des identifiants valides', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PWD });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('retourne 401 pour un mauvais mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: 'mauvais!' });

    expect(res.status).toBe(401);
  });

  it('retourne 401 pour un email inconnu', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inconnu@test.com', password: TEST_PWD });

    expect(res.status).toBe(401);
  });
});

describe('Flux refresh / logout', () => {
  let refreshToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PWD });
    refreshToken = res.body.data.refreshToken;
  });

  it('rafraîchit le token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    refreshToken = res.body.data.refreshToken;
  });

  it('se déconnecte et invalide le refresh token', async () => {
    const logout = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });

    expect(logout.status).toBe(200);

    const retry = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(retry.status).toBe(401);
  });
});

describe('Routes protégées', () => {
  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('retourne 401 avec un token invalide', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer token.invalide.ici');
    expect(res.status).toBe(401);
  });
});
