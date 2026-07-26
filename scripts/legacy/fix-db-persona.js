const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`UPDATE User SET persona = 'PROFESSIONAL' WHERE persona = 'COOPERATIVE'`);
  console.log('Fixed DB personas!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
