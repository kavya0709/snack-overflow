import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import { createApp } from '../src/app';
import { setupTestDb, teardownTestDb, createTestUser, createTestAdmin, prisma } from './helpers/testDb';
import { Role } from '@prisma/client';

const app = createApp();

describe('Authentication', () => {
  beforeEach(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      await createTestUser({ email: 'user@test.com', password: 'password123' });

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('user@test.com');
      expect(res.body.user.password).toBeUndefined();
      // Cookie should be set
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      await createTestUser({ email: 'user@test.com', password: 'correctPassword' });

      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'wrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'nobody@test.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return user data when authenticated', async () => {
      await createTestUser({ email: 'user@test.com', password: 'password123' });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'password123' });

      const cookie = loginRes.headers['set-cookie'];

      const res = await request(app).get('/auth/me').set('Cookie', cookie);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('user@test.com');
    });
  });

  describe('Admin route access', () => {
    it('should allow admin to access admin route', async () => {
      const admin = await createTestAdmin({ email: 'admin@test.com' });
      
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@test.com', password: 'TestPass@123' });

      const cookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/snacks')
        .set('Cookie', cookie)
        .send({ name: 'Admin Snack', category: 'SWEET', quantity: 10, lowStockThreshold: 5 });

      expect(res.status).toBe(201);
    });

    it('should deny member from accessing admin route', async () => {
      await createTestUser({ email: 'member@test.com', password: 'TestPass@123', role: Role.MEMBER });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'member@test.com', password: 'TestPass@123' });

      const cookie = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/snacks')
        .set('Cookie', cookie)
        .send({ name: 'Member Snack', category: 'SWEET', quantity: 10 });

      expect(res.status).toBe(403);
    });

    it('should deny unauthenticated access to protected routes', async () => {
      const res = await request(app)
        .post('/snacks')
        .send({ name: 'Some Snack', category: 'SWEET', quantity: 10 });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear the auth cookie on logout', async () => {
      const res = await request(app).post('/auth/logout');
      expect(res.status).toBe(200);
      // Cookie should be cleared
      const setCookieHeader = res.headers['set-cookie'];
      if (setCookieHeader) {
        const cookieStr = Array.isArray(setCookieHeader)
          ? setCookieHeader.join('; ')
          : setCookieHeader;
        // Cleared cookies have expires in the past or max-age=0
        expect(cookieStr).toMatch(/token=;|token=$/);
      }
    });
  });
});
