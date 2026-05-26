import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log('🌱 Seeding generation rules for double booking...\n');

  // Find teachers with doubleSession enabled
  const teachers = await prisma.teacher.findMany({
    where: { doubleSession: true },
  });

  console.log(`Found ${teachers.length} teacher(s) with doubleSession enabled.\n`);

  // Find an admin user to use as createdById
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true },
  });

  if (!admin) {
    console.error('No admin user found. Please run the main seed first.');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;

  for (const teacher of teachers) {
    // Check if they already have a doubleBooking generation rule
    const existingRules = await prisma.schedulingRule.findMany({
      where: {
        action: 'doubleBooking',
        category: 'generation',
        deletedAt: null,
      },
    });

    const hasExisting = existingRules.some((r) => {
      if (!r.appliesTo) return true; // applies to all teachers
      const appliesTo = r.appliesTo as Record<string, unknown>;
      const teachers = appliesTo['teachers'] as string[] | undefined;
      return !teachers || teachers.length === 0 || teachers.includes(teacher.id);
    });

    if (!hasExisting) {
      await prisma.schedulingRule.create({
        data: {
          name: `Doble clase automática - ${teacher.name}`,
          naturalLanguage: `Generar doble sesión automática para ${teacher.name}`,
          category: 'generation',
          ruleType: 'general',
          action: 'doubleBooking',
          priority: 10,
          enabled: true,
          appliesTo: { teachers: [teacher.id] } as Prisma.InputJsonValue,
          createdById: admin.id,
        },
      });
      console.log(`  ✅ Created doubleBooking rule for teacher "${teacher.name}"`);
      created++;
    } else {
      console.log(`  ⏭️  Already has doubleBooking rule for "${teacher.name}"`);
      skipped++;
    }
  }

  console.log(`\nDone. ${created} created, ${skipped} skipped.`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
