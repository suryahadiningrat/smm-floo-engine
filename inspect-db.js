const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_schema = 'master' AND table_name = 'users' AND column_name = 'role';
    `;
    console.log('Role Column Info:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error inspecting DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
