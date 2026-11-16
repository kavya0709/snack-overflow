const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const users = await p.user.count();
  const snacks = await p.snack.count();
  const activities = await p.activity.count();
  console.log('Users:', users, '| Snacks:', snacks, '| Activities:', activities);
  
  if (users > 0) {
    const userList = await p.user.findMany({ select: { name: true, email: true, role: true } });
    console.log('\nUser list:');
    userList.forEach(u => console.log(`  ${u.role}: ${u.name} <${u.email}>`));
  }
  
  if (snacks > 0) {
    const snackList = await p.snack.findMany({ select: { name: true, category: true, quantity: true } });
    console.log('\nSnack list (first 5):');
    snackList.slice(0,5).forEach(s => console.log(`  ${s.name} (${s.category}) qty=${s.quantity}`));
  }
}

main()
  .catch(e => { console.error('DB Error:', e.message); })
  .finally(() => p.$disconnect());
