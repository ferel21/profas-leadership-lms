const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'hbasraf290@gmail.com' }
  });
  console.log("Database says user is:", user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
