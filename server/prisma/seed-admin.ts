import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const username = process.env.ADMIN_SEED_USERNAME;
const password = process.env.ADMIN_SEED_PASSWORD;

if (!username || !password) {
  console.error('Set ADMIN_SEED_USERNAME and ADMIN_SEED_PASSWORD before running this script.');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash(password!, 12);
  const admin = await prisma.adminUser.upsert({
    where: { username },
    create: { username: username!, passwordHash },
    update: { passwordHash },
  });
  console.log(`Admin user ready: ${admin.username} (id: ${admin.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
