import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import { createApp } from '../src/app';
import {
  setupTestDb,
  teardownTestDb,
  createTestUser,
  createTestAdmin,
  createTestSnack,
  prisma,
} from './helpers/testDb';
import { Category, Role } from '@prisma/client';

const app = createApp();

async function loginAs(email: string, password = 'TestPass@123') {
  const res = await request(app).post('/auth/login').send({ email, password });
  return res.headers['set-cookie'] as unknown as string[];
}

describe('Snacks API', () => {
  let adminCookie: string[];
  let memberCookie: string[];

  beforeEach(async () => {
    await setupTestDb();
    await createTestAdmin({ email: 'admin@test.com' });
    await createTestUser({ email: 'member@test.com', role: Role.MEMBER });
    adminCookie = await loginAs('admin@test.com');
    memberCookie = await loginAs('member@test.com');
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('GET /snacks', () => {
    it('should return paginated snacks', async () => {
      await createTestSnack({ name: 'Snack A', category: Category.SWEET, quantity: 10 });
      await createTestSnack({ name: 'Snack B', category: Category.DRINK, quantity: 3 });

      const res = await request(app).get('/snacks').set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.snacks).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(2);
    });

    it('should search snacks by name', async () => {
      await createTestSnack({ name: 'Chocolate Chip Cookie', category: Category.SWEET });
      await createTestSnack({ name: 'Vanilla Wafer', category: Category.SWEET });

      const res = await request(app).get('/snacks?search=chocolate').set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.snacks).toHaveLength(1);
      expect(res.body.snacks[0].name).toContain('Chocolate');
    });

    it('should filter snacks by category', async () => {
      await createTestSnack({ name: 'Candy', category: Category.SWEET });
      await createTestSnack({ name: 'Chips', category: Category.SAVOURY });
      await createTestSnack({ name: 'Juice', category: Category.DRINK });

      const res = await request(app).get('/snacks?category=SWEET').set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.snacks).toHaveLength(1);
      expect(res.body.snacks[0].category).toBe('SWEET');
    });

    it('should filter snacks by status RUNNING_LOW', async () => {
      await createTestSnack({ name: 'Full Snack', quantity: 20, lowStockThreshold: 5 });
      await createTestSnack({ name: 'Low Snack', quantity: 2, lowStockThreshold: 5 });
      await createTestSnack({ name: 'Empty Snack', quantity: 0, lowStockThreshold: 5 });

      const res = await request(app).get('/snacks?status=RUNNING_LOW').set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.snacks).toHaveLength(1);
      expect(res.body.snacks[0].name).toBe('Low Snack');
      expect(res.body.snacks[0].status).toBe('RUNNING_LOW');
    });

    it('should filter snacks by status GONE', async () => {
      await createTestSnack({ name: 'Full Snack', quantity: 20 });
      await createTestSnack({ name: 'Empty Snack', quantity: 0 });

      const res = await request(app).get('/snacks?status=GONE').set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.snacks).toHaveLength(1);
      expect(res.body.snacks[0].status).toBe('GONE');
    });

    it('should paginate results correctly', async () => {
      for (let i = 1; i <= 15; i++) {
        await createTestSnack({ name: `Snack ${i.toString().padStart(2, '0')}` });
      }

      const page1 = await request(app).get('/snacks?page=1&limit=10').set('Cookie', adminCookie);
      const page2 = await request(app).get('/snacks?page=2&limit=10').set('Cookie', adminCookie);

      expect(page1.status).toBe(200);
      expect(page1.body.snacks).toHaveLength(10);
      expect(page1.body.pagination.totalPages).toBe(2);
      expect(page1.body.pagination.hasNext).toBe(true);

      expect(page2.status).toBe(200);
      expect(page2.body.snacks).toHaveLength(5);
      expect(page2.body.pagination.hasPrev).toBe(true);
    });
  });

  describe('POST /snacks (Admin only)', () => {
    it('should create a snack as admin', async () => {
      const res = await request(app)
        .post('/snacks')
        .set('Cookie', adminCookie)
        .send({ name: 'New Snack', category: 'SWEET', quantity: 10, lowStockThreshold: 3 });

      expect(res.status).toBe(201);
      expect(res.body.snack.name).toBe('New Snack');
      expect(res.body.snack.status).toBe('STOCKED');
    });

    it('should reject snack creation as member', async () => {
      const res = await request(app)
        .post('/snacks')
        .set('Cookie', memberCookie)
        .send({ name: 'Member Snack', category: 'SWEET', quantity: 10 });

      expect(res.status).toBe(403);
    });

    it('should reject duplicate snack names', async () => {
      await createTestSnack({ name: 'Unique Snack' });

      const res = await request(app)
        .post('/snacks')
        .set('Cookie', adminCookie)
        .send({ name: 'Unique Snack', category: 'SWEET', quantity: 5 });

      expect(res.status).toBe(409);
    });

    it('should reject invalid category', async () => {
      const res = await request(app)
        .post('/snacks')
        .set('Cookie', adminCookie)
        .send({ name: 'Bad Snack', category: 'INVALID', quantity: 5 });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /snacks/:id', () => {
    it('should update a snack as admin', async () => {
      const snack = await createTestSnack({ name: 'Old Name' });

      const res = await request(app)
        .patch(`/snacks/${snack.id}`)
        .set('Cookie', adminCookie)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.snack.name).toBe('New Name');
    });

    it('should return 404 for non-existent snack', async () => {
      const res = await request(app)
        .patch('/snacks/00000000-0000-0000-0000-000000000000')
        .set('Cookie', adminCookie)
        .send({ name: 'Updated' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /snacks/:id', () => {
    it('should delete a snack as admin', async () => {
      const snack = await createTestSnack({ name: 'To Delete' });

      const res = await request(app)
        .delete(`/snacks/${snack.id}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);

      const check = await request(app)
        .get(`/snacks/${snack.id}`)
        .set('Cookie', adminCookie);
      expect(check.status).toBe(404);
    });

    it('should preserve activity history when snack is deleted', async () => {
      const snack = await createTestSnack({ name: 'Historical Snack', quantity: 10 });
      
      // Create an activity
      const member = await prisma.user.findFirst({ where: { role: Role.MEMBER } });
      await prisma.activity.create({
        data: { userId: member!.id, snackId: snack.id, action: 'CONSUMED', amount: 1 },
      });

      await request(app).delete(`/snacks/${snack.id}`).set('Cookie', adminCookie);

      // Activity should still exist with null snackId
      const activities = await prisma.activity.findMany({});
      expect(activities.length).toBe(1);
      expect(activities[0].snackId).toBeNull();
    });
  });
});
