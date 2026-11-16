/**
 * CONCURRENCY TEST — MANDATORY
 *
 * Tests that the atomic PostgreSQL UPDATE prevents race conditions when
 * multiple users try to consume the last few units simultaneously.
 *
 * Scenario:
 *   - 1 snack with quantity = 3
 *   - 10 users each attempt to consume 1 unit simultaneously
 *   - Expected: exactly 3 succeed, 7 get HTTP 409
 *   - Final quantity must be exactly 0
 *   - Exactly 3 CONSUMED activity records must exist
 *
 * This test runs against a REAL PostgreSQL database (no mocks).
 */

import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import { createApp } from '../src/app';
import {
  setupTestDb,
  teardownTestDb,
  createTestUser,
  createTestSnack,
  prisma,
} from './helpers/testDb';
import { Role } from '@prisma/client';

const app = createApp();

async function loginAs(email: string) {
  const res = await request(app)
    .post('/auth/login')
    .send({ email, password: 'TestPass@123' });
  return res.headers['set-cookie'] as unknown as string[];
}

describe('CONCURRENCY TEST – Simultaneous Consumption', () => {
  const NUM_USERS = 10;
  const INITIAL_QUANTITY = 3;

  let userCookies: string[][];
  let snackId: string;

  beforeAll(async () => {
    await setupTestDb();

    // Create 10 test users
    const users = await Promise.all(
      Array.from({ length: NUM_USERS }, (_, i) =>
        createTestUser({
          email: `concurrent-user-${i}@test.com`,
          role: Role.MEMBER,
        }),
      ),
    );

    // Log in all 10 users to get their cookies
    userCookies = await Promise.all(
      users.map((_, i) => loginAs(`concurrent-user-${i}@test.com`)),
    );

    // Create a snack with quantity = 3
    const snack = await createTestSnack({
      name: 'Last Packet Snack',
      quantity: INITIAL_QUANTITY,
      lowStockThreshold: 5,
    });
    snackId = snack.id;
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  it('should handle 10 concurrent consumption requests correctly', async () => {
    // Fire all 10 requests simultaneously
    const results = await Promise.all(
      userCookies.map((cookie) =>
        request(app)
          .post(`/snacks/${snackId}/consume`)
          .set('Cookie', cookie)
          .send({ amount: 1 }),
      ),
    );

    const successes = results.filter((r) => r.status === 200);
    const conflicts = results.filter((r) => r.status === 409);
    const otherErrors = results.filter((r) => r.status !== 200 && r.status !== 409);

    console.log(`\n📊 Concurrency Test Results:`);
    console.log(`   ✅ Successes (200): ${successes.length}`);
    console.log(`   ❌ Conflicts (409): ${conflicts.length}`);
    console.log(`   ⚠️  Other errors:   ${otherErrors.length}`);

    // Exactly 3 should succeed
    expect(successes.length).toBe(INITIAL_QUANTITY);

    // Exactly 7 should get 409
    expect(conflicts.length).toBe(NUM_USERS - INITIAL_QUANTITY);

    // No unexpected errors
    expect(otherErrors.length).toBe(0);

    // Verify 409 responses have the correct error code
    for (const conflict of conflicts) {
      expect(conflict.body.error.code).toBe('INSUFFICIENT_STOCK');
    }
  });

  it('should leave the final database quantity at exactly 0', async () => {
    const snack = await prisma.snack.findUnique({ where: { id: snackId } });
    expect(snack).not.toBeNull();
    expect(snack!.quantity).toBe(0);
    console.log(`   📦 Final quantity: ${snack!.quantity} ✅`);
  });

  it('should have created exactly 3 CONSUMED activity records', async () => {
    const activities = await prisma.activity.findMany({
      where: { snackId, action: 'CONSUMED' },
    });
    expect(activities.length).toBe(INITIAL_QUANTITY);
    console.log(`   📝 Activity records: ${activities.length} ✅`);
  });
});
