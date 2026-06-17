import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ Connecting to the database...');
  
  // 1. Try to create a dummy user
  const newUser = await prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Nandini Test',
      password: 'super_secure_password_123',
    },
  });
  
  console.log('✅ Success! Created a new user:', newUser);

  // 2. Count all users in the database
  const allUsers = await prisma.user.findMany();
  console.log(`📊 Total users in database currently: ${allUsers.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Database test failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });