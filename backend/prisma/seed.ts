import { PrismaClient, Role, Category } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Users ---
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const memberPassword = await bcrypt.hash('Member@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@snackoverflow.com' },
    update: { password: adminPassword },
    create: {
      name: 'Pantry Admin',
      email: 'admin@snackoverflow.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'member@snackoverflow.com' },
    update: { password: memberPassword },
    create: {
      name: 'Demo Member',
      email: 'member@snackoverflow.com',
      password: memberPassword,
      role: Role.MEMBER,
    },
  });

  // Create additional members for seeding votes
  const memberEmails = [
    'alice@snackoverflow.com',
    'bob@snackoverflow.com',
    'carol@snackoverflow.com',
    'dave@snackoverflow.com',
  ];
  const extraMembers = [];
  for (const email of memberEmails) {
    const extraMember = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
        email,
        password: memberPassword,
        role: Role.MEMBER,
      },
    });
    extraMembers.push(extraMember);
  }

  console.log(`✅ Users seeded: ${admin.name}, ${member.name}, and ${extraMembers.length} extras`);

  // --- Snacks ---
  const snackData = [
    // SWEET - amply stocked
    { name: 'Oreo Cookies', category: Category.SWEET, quantity: 20, lowStockThreshold: 5 },
    { name: 'Cadbury Dairy Milk', category: Category.SWEET, quantity: 15, lowStockThreshold: 5 },
    { name: 'Kit Kat', category: Category.SWEET, quantity: 3, lowStockThreshold: 5 }, // RUNNING_LOW
    { name: 'Gummy Bears', category: Category.SWEET, quantity: 0, lowStockThreshold: 5 }, // GONE

    // SAVOURY
    { name: 'Lays Classic', category: Category.SAVOURY, quantity: 25, lowStockThreshold: 8 },
    { name: 'Cheetos Puffs', category: Category.SAVOURY, quantity: 4, lowStockThreshold: 5 }, // RUNNING_LOW
    { name: 'Pretzels', category: Category.SAVOURY, quantity: 12, lowStockThreshold: 5 },
    { name: 'Popcorn', category: Category.SAVOURY, quantity: 0, lowStockThreshold: 3 }, // GONE

    // DRINK
    { name: 'Red Bull', category: Category.DRINK, quantity: 18, lowStockThreshold: 6 },
    { name: 'Coconut Water', category: Category.DRINK, quantity: 2, lowStockThreshold: 5 }, // RUNNING_LOW
    { name: 'Cold Brew Coffee', category: Category.DRINK, quantity: 10, lowStockThreshold: 4 },

    // HEALTHY_ISH
    { name: 'Mixed Nuts', category: Category.HEALTHY_ISH, quantity: 14, lowStockThreshold: 5 },
    { name: 'Protein Bar', category: Category.HEALTHY_ISH, quantity: 1, lowStockThreshold: 5 }, // RUNNING_LOW
    { name: 'Rice Cakes', category: Category.HEALTHY_ISH, quantity: 8, lowStockThreshold: 5 },
  ];

  const snacks: Awaited<ReturnType<typeof prisma.snack.upsert>>[] = [];
  for (const snack of snackData) {
    const created = await prisma.snack.upsert({
      where: { name: snack.name },
      update: { quantity: snack.quantity, lowStockThreshold: snack.lowStockThreshold },
      create: snack,
    });
    snacks.push(created);
  }

  console.log(`✅ Snacks seeded: ${snacks.length} snacks`);

  // --- Votes (this week so Snack of the Week works) ---
  // Map snack name to snack object for easy lookup
  const snackMap = Object.fromEntries(snacks.map((s) => [s.name, s]));

  const allUsers = [admin, member, ...extraMembers];

  // Create votes to demonstrate Snack of the Week
  // Oreo Cookies gets the most votes this week
  const voteData: { userId: string; snackId: string }[] = [
    // Oreo gets 5 votes (winner)
    { userId: allUsers[0].id, snackId: snackMap['Oreo Cookies'].id },
    { userId: allUsers[1].id, snackId: snackMap['Oreo Cookies'].id },
    { userId: allUsers[2].id, snackId: snackMap['Oreo Cookies'].id },
    { userId: allUsers[3].id, snackId: snackMap['Oreo Cookies'].id },
    { userId: allUsers[4].id, snackId: snackMap['Oreo Cookies'].id },
    // Lays gets 3 votes
    { userId: allUsers[0].id, snackId: snackMap['Lays Classic'].id },
    { userId: allUsers[1].id, snackId: snackMap['Lays Classic'].id },
    { userId: allUsers[2].id, snackId: snackMap['Lays Classic'].id },
    // Red Bull gets 2 votes
    { userId: allUsers[0].id, snackId: snackMap['Red Bull'].id },
    { userId: allUsers[1].id, snackId: snackMap['Red Bull'].id },
    // Mixed Nuts gets 1 vote
    { userId: allUsers[0].id, snackId: snackMap['Mixed Nuts'].id },
  ];

  for (const vote of voteData) {
    await prisma.vote.upsert({
      where: { userId_snackId: { userId: vote.userId, snackId: vote.snackId } },
      update: {},
      create: vote,
    });
  }

  console.log(`✅ Votes seeded`);

  // --- Activity records ---
  const activities = [
    { userId: admin.id, snackId: snackMap['Oreo Cookies'].id, action: 'RESTOCKED' as const, amount: 20 },
    { userId: member.id, snackId: snackMap['Oreo Cookies'].id, action: 'CONSUMED' as const, amount: 2 },
    { userId: admin.id, snackId: snackMap['Red Bull'].id, action: 'RESTOCKED' as const, amount: 20 },
    { userId: member.id, snackId: snackMap['Red Bull'].id, action: 'CONSUMED' as const, amount: 2 },
    { userId: admin.id, snackId: snackMap['Lays Classic'].id, action: 'RESTOCKED' as const, amount: 30 },
    { userId: member.id, snackId: snackMap['Lays Classic'].id, action: 'CONSUMED' as const, amount: 5 },
  ];

  for (const activity of activities) {
    await prisma.activity.create({ data: activity });
  }

  console.log(`✅ Activities seeded`);
  console.log('\n🎉 Database seeded successfully!\n');
  console.log('Demo credentials:');
  console.log('  Admin: admin@snackoverflow.com / Admin@123');
  console.log('  Member: member@snackoverflow.com / Member@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
