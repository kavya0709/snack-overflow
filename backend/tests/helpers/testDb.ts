import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, Role, Category } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function setupTestDb() {
  // Clean in correct order (FK deps)
  await prisma.activity.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.snack.deleteMany();
  await prisma.user.deleteMany();
}

export async function teardownTestDb() {
  await setupTestDb();
  await prisma.$disconnect();
}

export async function createTestUser(overrides: {
  email?: string;
  name?: string;
  role?: Role;
  password?: string;
} = {}) {
  const hash = await bcrypt.hash(overrides.password || 'TestPass@123', 10);
  return prisma.user.create({
    data: {
      name: overrides.name || 'Test User',
      email: overrides.email || `test-${Date.now()}@example.com`,
      password: hash,
      role: overrides.role || Role.MEMBER,
    },
  });
}

export async function createTestAdmin(overrides: { email?: string } = {}) {
  return createTestUser({
    name: 'Test Admin',
    email: overrides.email || 'admin@test.com',
    role: Role.ADMIN,
  });
}

export async function createTestSnack(overrides: {
  name?: string;
  category?: Category;
  quantity?: number;
  lowStockThreshold?: number;
} = {}) {
  return prisma.snack.create({
    data: {
      name: overrides.name || `Test Snack ${Date.now()}`,
      category: overrides.category || Category.SWEET,
      quantity: overrides.quantity ?? 10,
      lowStockThreshold: overrides.lowStockThreshold ?? 5,
    },
  });
}

export { prisma };
