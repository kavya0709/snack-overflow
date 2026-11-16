import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { config } from './config/env';
import { prisma } from './config/prisma';

const app = createApp();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    app.listen(config.port, () => {
      console.log(`🚀 Snack Overflow backend running on http://localhost:${config.port}`);
      console.log(`   Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
