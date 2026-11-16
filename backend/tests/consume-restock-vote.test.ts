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
import { Role } from '@prisma/client';

const app = createApp();

async function loginAs(email: string, password = 'TestPass@123') {
  const res = await request(app).post('/auth/login').send({ email, password });
  return res.headers['set-cookie'] as unknown as string[];
}

describe('Consume API', () => {
  let memberCookie: string[];
  let memberId: string;

  beforeEach(async () => {
    await setupTestDb();
    await createTestAdmin({ email: 'admin@test.com' });
    const member = await createTestUser({ email: 'member@test.com', role: Role.MEMBER });
    memberId = member.id;
    memberCookie = await loginAs('member@test.com');
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('should successfully consume a snack', async () => {
    const snack = await createTestSnack({ name: 'Yummy Snack', quantity: 10 });

    const res = await request(app)
      .post(`/snacks/${snack.id}/consume`)
      .set('Cookie', memberCookie)
      .send({ amount: 2 });

    expect(res.status).toBe(200);
    expect(res.body.snack.quantity).toBe(8);

    // Check DB quantity
    const updated = await prisma.snack.findUnique({ where: { id: snack.id } });
    expect(updated!.quantity).toBe(8);
  });

  it('should record a CONSUMED activity', async () => {
    const snack = await createTestSnack({ name: 'Activity Snack', quantity: 10 });

    await request(app)
      .post(`/snacks/${snack.id}/consume`)
      .set('Cookie', memberCookie)
      .send({ amount: 3 });

    const activities = await prisma.activity.findMany({
      where: { snackId: snack.id, action: 'CONSUMED' },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].amount).toBe(3);
    expect(activities[0].userId).toBe(memberId);
  });

  it('should return 409 when stock is insufficient', async () => {
    const snack = await createTestSnack({ name: 'Low Snack', quantity: 2 });

    const res = await request(app)
      .post(`/snacks/${snack.id}/consume`)
      .set('Cookie', memberCookie)
      .send({ amount: 5 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');

    // Quantity must remain unchanged
    const unchanged = await prisma.snack.findUnique({ where: { id: snack.id } });
    expect(unchanged!.quantity).toBe(2);
  });

  it('should return 409 when snack is GONE (quantity = 0)', async () => {
    const snack = await createTestSnack({ name: 'Empty Snack', quantity: 0 });

    const res = await request(app)
      .post(`/snacks/${snack.id}/consume`)
      .set('Cookie', memberCookie)
      .send({ amount: 1 });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INSUFFICIENT_STOCK');
  });

  it('should return 404 for non-existent snack', async () => {
    const res = await request(app)
      .post('/snacks/00000000-0000-0000-0000-000000000000/consume')
      .set('Cookie', memberCookie)
      .send({ amount: 1 });

    expect(res.status).toBe(404);
  });

  it('should reject zero amount', async () => {
    const snack = await createTestSnack({ quantity: 10 });

    const res = await request(app)
      .post(`/snacks/${snack.id}/consume`)
      .set('Cookie', memberCookie)
      .send({ amount: 0 });

    expect(res.status).toBe(400);
  });

  it('should reject negative amount', async () => {
    const snack = await createTestSnack({ quantity: 10 });

    const res = await request(app)
      .post(`/snacks/${snack.id}/consume`)
      .set('Cookie', memberCookie)
      .send({ amount: -1 });

    expect(res.status).toBe(400);
  });

  it('should never allow quantity to go below zero', async () => {
    const snack = await createTestSnack({ name: 'Protected Snack', quantity: 1 });

    // Try to consume 2 from a quantity-1 snack
    const res = await request(app)
      .post(`/snacks/${snack.id}/consume`)
      .set('Cookie', memberCookie)
      .send({ amount: 2 });

    expect(res.status).toBe(409);

    const final = await prisma.snack.findUnique({ where: { id: snack.id } });
    expect(final!.quantity).toBeGreaterThanOrEqual(0);
  });
});

describe('Restock API', () => {
  let adminCookie: string[];
  let memberCookie: string[];
  let adminId: string;

  beforeEach(async () => {
    await setupTestDb();
    const admin = await createTestAdmin({ email: 'admin@test.com' });
    adminId = admin.id;
    await createTestUser({ email: 'member@test.com', role: Role.MEMBER });
    adminCookie = await loginAs('admin@test.com');
    memberCookie = await loginAs('member@test.com');
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('should allow admin to restock a snack', async () => {
    const snack = await createTestSnack({ name: 'Restock Snack', quantity: 5 });

    const res = await request(app)
      .post(`/snacks/${snack.id}/restock`)
      .set('Cookie', adminCookie)
      .send({ amount: 10 });

    expect(res.status).toBe(200);
    expect(res.body.snack.quantity).toBe(15);
  });

  it('should record a RESTOCKED activity', async () => {
    const snack = await createTestSnack({ name: 'Activity Restock', quantity: 5 });

    await request(app)
      .post(`/snacks/${snack.id}/restock`)
      .set('Cookie', adminCookie)
      .send({ amount: 10 });

    const activities = await prisma.activity.findMany({
      where: { snackId: snack.id, action: 'RESTOCKED' },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].amount).toBe(10);
    expect(activities[0].userId).toBe(adminId);
  });

  it('should deny member from restocking', async () => {
    const snack = await createTestSnack({ quantity: 5 });

    const res = await request(app)
      .post(`/snacks/${snack.id}/restock`)
      .set('Cookie', memberCookie)
      .send({ amount: 10 });

    expect(res.status).toBe(403);
  });

  it('should reject invalid restock amounts', async () => {
    const snack = await createTestSnack({ quantity: 5 });

    const negRes = await request(app)
      .post(`/snacks/${snack.id}/restock`)
      .set('Cookie', adminCookie)
      .send({ amount: -5 });
    expect(negRes.status).toBe(400);

    const zeroRes = await request(app)
      .post(`/snacks/${snack.id}/restock`)
      .set('Cookie', adminCookie)
      .send({ amount: 0 });
    expect(zeroRes.status).toBe(400);
  });
});

describe('Voting API', () => {
  let member1Cookie: string[];
  let member2Cookie: string[];
  let member1Id: string;

  beforeEach(async () => {
    await setupTestDb();
    await createTestAdmin({ email: 'admin@test.com' });
    const m1 = await createTestUser({ email: 'member1@test.com', role: Role.MEMBER });
    const m2 = await createTestUser({ email: 'member2@test.com', role: Role.MEMBER });
    member1Id = m1.id;
    member1Cookie = await loginAs('member1@test.com');
    member2Cookie = await loginAs('member2@test.com');
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('should allow a user to vote for a snack', async () => {
    const snack = await createTestSnack({ name: 'Voted Snack' });

    const res = await request(app)
      .post(`/snacks/${snack.id}/vote`)
      .set('Cookie', member1Cookie);

    expect(res.status).toBe(201);
    expect(res.body.hasVoted).toBe(true);
    expect(res.body.voteCount).toBe(1);
  });

  it('should reject a duplicate vote', async () => {
    const snack = await createTestSnack({ name: 'Double Vote Snack' });

    await request(app).post(`/snacks/${snack.id}/vote`).set('Cookie', member1Cookie);

    const res = await request(app)
      .post(`/snacks/${snack.id}/vote`)
      .set('Cookie', member1Cookie);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_VOTED');

    // Verify only 1 vote in DB
    const count = await prisma.vote.count({ where: { snackId: snack.id } });
    expect(count).toBe(1);
  });

  it('should allow a user to remove their vote', async () => {
    const snack = await createTestSnack({ name: 'Removeable Vote' });

    await request(app).post(`/snacks/${snack.id}/vote`).set('Cookie', member1Cookie);

    const res = await request(app)
      .delete(`/snacks/${snack.id}/vote`)
      .set('Cookie', member1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.hasVoted).toBe(false);
    expect(res.body.voteCount).toBe(0);
  });

  it('should handle concurrent duplicate vote attempts safely', async () => {
    const snack = await createTestSnack({ name: 'Concurrent Vote Snack' });

    // Send 5 concurrent vote requests from the same user
    const results = await Promise.allSettled(
      Array(5).fill(null).map(() =>
        request(app).post(`/snacks/${snack.id}/vote`).set('Cookie', member1Cookie),
      ),
    );

    const successes = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 201,
    );
    const conflicts = results.filter(
      (r) => r.status === 'fulfilled' && r.value.status === 409,
    );

    // Exactly 1 success, 4 conflicts
    expect(successes.length).toBe(1);
    expect(conflicts.length).toBe(4);

    // DB has exactly 1 vote
    const count = await prisma.vote.count({ where: { snackId: snack.id } });
    expect(count).toBe(1);
  });
});
