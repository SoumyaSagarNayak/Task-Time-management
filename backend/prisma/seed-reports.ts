import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';

const prisma = new PrismaClient();

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
    console.log('Starting Reports Dashboard Seed...');

    // 1. Create Users
    const usersData = [
        { email: 'alice@webyalaya.com', clerkId: 'user_seed_alice', firstName: 'Alice', lastName: 'Smith' },
        { email: 'bob@webyalaya.com', clerkId: 'user_seed_bob', firstName: 'Bob', lastName: 'Jones' },
        { email: 'charlie@webyalaya.com', clerkId: 'user_seed_charlie', firstName: 'Charlie', lastName: 'Brown' },
        { email: 'diana@webyalaya.com', clerkId: 'user_seed_diana', firstName: 'Diana', lastName: 'Prince' },
        { email: 'evan@webyalaya.com', clerkId: 'user_seed_evan', firstName: 'Evan', lastName: 'Wright' },
        { email: 'fiona@webyalaya.com', clerkId: 'user_seed_fiona', firstName: 'Fiona', lastName: 'Gallagher' },
    ];

    const createdUsers: any[] = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { clerkId: u.clerkId },
      update: {},
      create: { ...u },
    });
    createdUsers.push(user);
  }

  // 2. Create Tasks
  const taskNames = [
    'Design System Refactor', 'API Architecture Review', 'Sprint Planning',
    'Homepage Redesign', 'Database Migration', 'User Research',
    'Implement Auth Flow', 'Fix Login Bugs', 'Update Documentation',
    'Client Meeting', 'Weekly Sync', 'Code Review Pipeline',
    'Payment Gateway Integration', 'Marketing Landing Page', 'Optimize Images',
    'Setup CI/CD', 'SEO Improvements', 'Accessibility Audit'
  ];

  const createdTasks: any[] = [];
  for (const tName of taskNames) {
    const isBillable = Math.random() > 0.3; // 70% billable
    const task = await prisma.task.create({
      data: {
        title: tName,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
      }
    });
    createdTasks.push({ ...task, isBillable });
  }

  // 3. Create Time Entries (15 days to avoid timeout)
  const endDate = new Date(); // Today
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 15);

  const timeEntries: any[] = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Skip weekends mostly
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (Math.random() > 0.1) continue; // 10% chance to work on weekend
    }

    // Each user logs 4-8 hours a day in chunks
    for (const user of createdUsers) {
      // 1-4 entries per day per user
      const entriesCount = Math.floor(Math.random() * 4) + 1;
      let totalHoursLoggedToday = 0;

      for (let i = 0; i < entriesCount; i++) {
        if (totalHoursLoggedToday >= 8) break;

        const taskObj = createdTasks[Math.floor(Math.random() * createdTasks.length)];
        const hours = Math.round((Math.random() * 2.5 + 0.5) * 2) / 2; // 0.5 to 3.0 in 0.5 increments

        // Random start time between 8 AM and 5 PM
        const startHour = 8 + Math.floor(Math.random() * 9);
        const startMin = Math.random() > 0.5 ? 0 : 30;

        const startTime = new Date(d);
        startTime.setHours(startHour, startMin, 0, 0);

        const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

        totalHoursLoggedToday += hours;

        timeEntries.push({
          userId: user.id,
          startTime,
          endTime,
          hours,
          isBillable: taskObj.isBillable,
          description: `Worked on ${taskObj.title}`,
          taskId: taskObj.id, // We'll connect it after
        });
      }
    }
  }

  console.log(`Inserting ${timeEntries.length} time entries inside a transaction...`);

  // Run in a single transaction with a large timeout (5 minutes)
  await prisma.$transaction(async (tx) => {
    let index = 0;
    for (const entry of timeEntries) {
      const { taskId, ...data } = entry;
      await tx.timeEntry.create({
        data: {
          ...data,
          tasks: { connect: { id: taskId } }
        }
      });
      index++;
      if (index % 50 === 0) {
        console.log(`Prepared ${index}/${timeEntries.length} entries in transaction...`);
      }
    }
  }, {
    timeout: 300000, // 5 minutes timeout
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding dashboard data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
