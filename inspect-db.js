const prisma = require('./utils/prisma');

async function main() {
  try {
    // Check enum values
    const result = await prisma.$queryRaw`
      SELECT e.enumlabel 
      FROM pg_enum e 
      JOIN pg_type t ON e.enumtypid = t.oid 
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE t.typname = 'enum_users_role';
    `;
    console.log('Enum Values:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error inspecting DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
