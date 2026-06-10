// Seed tags globally
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tags = [
    { name: 'Frontend', color: '#3B82F6' },
    { name: 'Backend', color: '#10B981' },
    { name: 'Bug', color: '#EF4444' },
    { name: 'Feature', color: '#8B5CF6' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { name: tag.name },
      update: { color: tag.color },
      create: {
        name: tag.name,
        color: tag.color,
      },
    });
  }

  console.log('Tags seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

