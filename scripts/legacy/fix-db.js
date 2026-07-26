const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`UPDATE User SET role = 'STUDENT' WHERE role = 'INSTITUTION_ADMIN'`);
  console.log('Fixed DB roles!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
