const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Bq9xd5MqZfBeMkwFXRi5tHbTitC54EaeXin26hNTVXyqBYSay0hQL74pz7gsObUq@187.127.214.192:3000/postgres"
    }
  }
});

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log("Connected successfully to VPS DB:", result);
  } catch (e) {
    console.error("Failed to connect to VPS DB:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
