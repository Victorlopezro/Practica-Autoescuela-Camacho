import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log('🌱 Seeding database...\n');

  const adminPw = await argon2.hash('admin123');
  const teacherPw = await argon2.hash('teacher123');
  const studentPw = await argon2.hash('student123');

  // ─── 1. Admin ───────────────────────────────────────────────
  console.log('Creating admin user...');
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      id: 'u-admin-0001',
      username: 'admin',
      password: adminPw,
      role: 'admin',
      name: 'Carlos',
      lastName: 'Camacho',
      email: 'carlos@autoescuela.com',
      phone: '600111111',
    },
  });

  // ─── 2. Teachers ────────────────────────────────────────────
  const teachers = [
    { id: 't-0001', name: 'Juan Pérez', user: { id: 'u-teach-0001', username: 'jperez', name: 'Juan', lastName: 'Pérez', email: 'juan.perez@autoescuela.com', phone: '600222111' } },
    { id: 't-0002', name: 'María García', user: { id: 'u-teach-0002', username: 'mgarcia', name: 'María', lastName: 'García', email: 'maria.garcia@autoescuela.com', phone: '600222112' } },
    { id: 't-0003', name: 'Luis López', user: { id: 'u-teach-0003', username: 'llopez', name: 'Luis', lastName: 'López', email: 'luis.lopez@autoescuela.com', phone: '600222113' } },
    { id: 't-0004', name: 'Ana Rodríguez', user: { id: 'u-teach-0004', username: 'arodriguez', name: 'Ana', lastName: 'Rodríguez', email: 'ana.rodriguez@autoescuela.com', phone: '600222114' } },
  ];

  for (const t of teachers) {
    console.log(`  Teacher: ${t.name} (${t.user.username} / teacher123)`);
    await prisma.teacher.upsert({
      where: { id: t.id },
      update: { name: t.name },
      create: { id: t.id, name: t.name },
    });
    await prisma.user.upsert({
      where: { username: t.user.username },
      update: {},
      create: {
        id: t.user.id,
        username: t.user.username,
        password: teacherPw,
        role: 'teacher',
        teacherId: t.id,
        name: t.user.name,
        lastName: t.user.lastName,
        email: t.user.email,
        phone: t.user.phone,
        createdById: 'u-admin-0001',
      },
    });
  }

  // ─── 3. Students ────────────────────────────────────────────
  const students = [
    {
      user: { id: 'u-stud-0001', username: 'pgomez', name: 'Pedro', lastName: 'Gómez', email: 'pedro.gomez@email.com', phone: '600333001' },
      student: { id: 's-0001', teacherId: 't-0001', licenseType: 'B', remainingClasses: 10, balanceHistory: [{ amount: 15000, reason: 'Pago inicial 10 clases', timestamp: '2026-05-01T10:00:00Z', adjustedBy: 'admin' }, { amount: -3000, reason: 'Clase #1 usada', timestamp: '2026-05-05T09:00:00Z', adjustedBy: 'system' }] },
    },
    {
      user: { id: 'u-stud-0002', username: 'lfernandez', name: 'Laura', lastName: 'Fernández', email: 'laura.fernandez@email.com', phone: '600333002' },
      student: { id: 's-0002', teacherId: 't-0002', licenseType: 'B-automatico', remainingClasses: 5, balanceHistory: [{ amount: 7500, reason: 'Pago 5 clases', timestamp: '2026-05-02T11:00:00Z', adjustedBy: 'admin' }] },
    },
    {
      user: { id: 'u-stud-0003', username: 'mmartinez', name: 'Mario', lastName: 'Martínez', email: 'mario.martinez@email.com', phone: '600333003' },
      student: { id: 's-0003', teacherId: 't-0003', licenseType: 'A2', remainingClasses: 20, balanceHistory: [{ amount: 30000, reason: 'Pago inicial 20 clases', timestamp: '2026-04-28T09:00:00Z', adjustedBy: 'admin' }] },
    },
    {
      user: { id: 'u-stud-0004', username: 'asanchez', name: 'Sofía', lastName: 'Sánchez', email: 'sofia.sanchez@email.com', phone: '600333004' },
      student: { id: 's-0004', teacherId: 't-0001', licenseType: 'B', remainingClasses: 3, balanceHistory: [{ amount: 9000, reason: 'Recarga 5 clases', timestamp: '2026-05-10T16:00:00Z', adjustedBy: 'admin' }, { amount: -1500, reason: 'Clase #1 usada', timestamp: '2026-05-12T10:00:00Z', adjustedBy: 'system' }, { amount: -1500, reason: 'Clase #2 usada', timestamp: '2026-05-14T10:00:00Z', adjustedBy: 'system' }] },
    },
    {
      user: { id: 'u-stud-0005', username: 'dtorres', name: 'Diego', lastName: 'Torres', email: 'diego.torres@email.com', phone: '600333005' },
      student: { id: 's-0005', teacherId: 't-0004', licenseType: 'AM', remainingClasses: 8, balanceHistory: [{ amount: 12000, reason: 'Pago 8 clases', timestamp: '2026-05-08T14:00:00Z', adjustedBy: 'admin' }] },
    },
    {
      user: { id: 'u-stud-0006', username: 'cruz', name: 'Carmen', lastName: 'Ruiz', email: 'carmen.ruiz@email.com', phone: '600333006' },
      student: { id: 's-0006', teacherId: 't-0002', licenseType: 'A1', remainingClasses: 15, balanceHistory: [{ amount: 22500, reason: 'Pago 15 clases', timestamp: '2026-05-03T12:00:00Z', adjustedBy: 'admin' }] },
    },
  ];

  for (const s of students) {
    console.log(`  Student: ${s.user.name} ${s.user.lastName} (${s.user.username} / student123) — ${s.student.remainingClasses} classes`);
    await prisma.user.upsert({
      where: { username: s.user.username },
      update: {},
      create: {
        id: s.user.id,
        username: s.user.username,
        password: studentPw,
        role: 'student',
        name: s.user.name,
        lastName: s.user.lastName,
        email: s.user.email,
        phone: s.user.phone,
        createdById: 'u-admin-0001',
      },
    });
    await prisma.student.upsert({
      where: { userId: s.user.id },
      update: { remainingClasses: s.student.remainingClasses, balanceHistory: s.student.balanceHistory, teacherId: s.student.teacherId, licenseType: s.student.licenseType },
      create: {
        id: s.student.id,
        userId: s.user.id,
        teacherId: s.student.teacherId,
        licenseType: s.student.licenseType,
        remainingClasses: s.student.remainingClasses,
        balanceHistory: s.student.balanceHistory,
      },
    });
  }

  // ─── 4. Vehicle Type Config ──────────────────────────────────
  console.log('Creating vehicle type config...');
  const typeConfigs = [
    { id: 'vtc-0001', type: 'coche-manual', duration: 45 },
    { id: 'vtc-0002', type: 'coche-automatico', duration: 45 },
    { id: 'vtc-0003', type: 'moto-pista', duration: 30 },
    { id: 'vtc-0004', type: 'moto-circulacion', duration: 45 },
  ];
  for (const vtc of typeConfigs) {
    await prisma.vehicleTypeConfig.upsert({
      where: { type: vtc.type },
      update: { duration: vtc.duration },
      create: vtc,
    });
  }

  // ─── 5. Teacher Availability ─────────────────────────────────
  console.log('Creating teacher availability schedules...');
  // Juan Pérez: Mon-Fri 9:00-14:00, 16:00-20:00
  const juanSchedule = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '14:00' },
    { dayOfWeek: 1, startTime: '16:00', endTime: '20:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '14:00' },
    { dayOfWeek: 2, startTime: '16:00', endTime: '20:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '14:00' },
    { dayOfWeek: 3, startTime: '16:00', endTime: '20:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '14:00' },
    { dayOfWeek: 4, startTime: '16:00', endTime: '20:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '14:00' },
    { dayOfWeek: 5, startTime: '16:00', endTime: '20:00' },
  ];
  // María García: Mon-Fri 8:00-14:00
  const mariaSchedule = [
    { dayOfWeek: 1, startTime: '08:00', endTime: '14:00' },
    { dayOfWeek: 2, startTime: '08:00', endTime: '14:00' },
    { dayOfWeek: 3, startTime: '08:00', endTime: '14:00' },
    { dayOfWeek: 4, startTime: '08:00', endTime: '14:00' },
    { dayOfWeek: 5, startTime: '08:00', endTime: '14:00' },
  ];
  // Luis López: Mon-Fri 15:00-21:00
  const luisSchedule = [
    { dayOfWeek: 1, startTime: '15:00', endTime: '21:00' },
    { dayOfWeek: 2, startTime: '15:00', endTime: '21:00' },
    { dayOfWeek: 3, startTime: '15:00', endTime: '21:00' },
    { dayOfWeek: 4, startTime: '15:00', endTime: '21:00' },
    { dayOfWeek: 5, startTime: '15:00', endTime: '21:00' },
  ];
  // Ana Rodríguez: Mon-Fri 9:00-15:00, Sat 9:00-13:00
  const anaSchedule = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '15:00' },
    { dayOfWeek: 2, startTime: '09:00', endTime: '15:00' },
    { dayOfWeek: 3, startTime: '09:00', endTime: '15:00' },
    { dayOfWeek: 4, startTime: '09:00', endTime: '15:00' },
    { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },
    { dayOfWeek: 6, startTime: '09:00', endTime: '13:00' },
  ];

  const schedules = [
    { teacherId: 't-0001', slots: juanSchedule },
    { teacherId: 't-0002', slots: mariaSchedule },
    { teacherId: 't-0003', slots: luisSchedule },
    { teacherId: 't-0004', slots: anaSchedule },
  ];

  for (const s of schedules) {
    for (const slot of s.slots) {
      await prisma.teacherAvailability.upsert({
        where: { teacherId_dayOfWeek: { teacherId: s.teacherId, dayOfWeek: slot.dayOfWeek } },
        update: { startTime: slot.startTime, endTime: slot.endTime },
        create: { teacherId: s.teacherId, ...slot },
      });
    }
  }
  console.log(`  Schedules created for ${schedules.length} teachers`);

  // ─── 6. Teacher-Vehicle Assignments ──────────────────────────
  console.log('Creating teacher-vehicle assignments...');
  const teacherVehicles = [
    // Juan: coche-manual
    { teacherId: 't-0001', vehicleId: 'v-0001' },
    // María: coche-automatico + coche-manual
    { teacherId: 't-0002', vehicleId: 'v-0002' },
    { teacherId: 't-0002', vehicleId: 'v-0003' },
    // Luis: motos
    { teacherId: 't-0003', vehicleId: 'v-0004' },
    { teacherId: 't-0003', vehicleId: 'v-0005' },
    // Ana: coche-manual
    { teacherId: 't-0004', vehicleId: 'v-0006' },
  ];

  for (const tv of teacherVehicles) {
    await prisma.teacherVehicle.upsert({
      where: { teacherId_vehicleId: { teacherId: tv.teacherId, vehicleId: tv.vehicleId } },
      update: {},
      create: tv,
    });
  }
  console.log(`  ${teacherVehicles.length} vehicle assignments created`);

  // ─── 7. Vehicles ────────────────────────────────────────────
  const vehicles = [
    { id: 'v-0001', plate: '1234ABC', type: 'coche-manual', status: 'available' },
    { id: 'v-0002', plate: '5678DEF', type: 'coche-automatico', status: 'available' },
    { id: 'v-0003', plate: '9012GHI', type: 'coche-manual', status: 'in-use' },
    { id: 'v-0004', plate: '3456JKL', type: 'moto-pista', status: 'available' },
    { id: 'v-0005', plate: '7890MNO', type: 'moto-circulacion', status: 'maintenance' },
    { id: 'v-0006', plate: '1111PQR', type: 'coche-manual', status: 'available' },
  ];

  for (const v of vehicles) {
    console.log(`  Vehicle: ${v.plate} — ${v.type} (${v.status})`);
    await prisma.vehicle.upsert({
      where: { plate: v.plate },
      update: { status: v.status, type: v.type },
      create: { id: v.id, plate: v.plate, type: v.type, status: v.status, itvExpiry: new Date('2026-12-31') },
    });
  }

  // ─── 8. Reservations ─────────────────────────────────────────
  const reservations = [
    { id: 'r-0001', studentId: 's-0001', teacherId: 't-0001', vehicleType: 'coche-manual', startTime: new Date('2026-05-20T09:00:00Z'), duration: 90, status: 'completed' },
    { id: 'r-0002', studentId: 's-0001', teacherId: 't-0001', vehicleType: 'coche-manual', startTime: new Date('2026-05-22T09:00:00Z'), duration: 45, status: 'confirmed' },
    { id: 'r-0003', studentId: 's-0002', teacherId: 't-0002', vehicleType: 'coche-automatico', startTime: new Date('2026-05-21T10:00:00Z'), duration: 90, status: 'confirmed' },
    { id: 'r-0004', studentId: 's-0003', teacherId: 't-0003', vehicleType: 'moto-pista', startTime: new Date('2026-05-23T08:00:00Z'), duration: 30, status: 'pending' },
    { id: 'r-0005', studentId: 's-0004', teacherId: 't-0001', vehicleType: 'coche-manual', startTime: new Date('2026-05-19T11:00:00Z'), duration: 90, status: 'cancelled' },
    { id: 'r-0006', studentId: 's-0005', teacherId: 't-0004', vehicleType: 'coche-manual', startTime: new Date('2026-05-24T16:00:00Z'), duration: 45, status: 'pending' },
    { id: 'r-0007', studentId: 's-0006', teacherId: 't-0002', vehicleType: 'coche-automatico', startTime: new Date('2026-05-25T11:00:00Z'), duration: 90, status: 'confirmed' },
    { id: 'r-0008', studentId: 's-0002', teacherId: 't-0003', vehicleType: 'moto-circulacion', startTime: new Date('2026-05-26T09:00:00Z'), duration: 45, status: 'pending' },
    { id: 'r-0009', studentId: 's-0003', teacherId: 't-0001', vehicleType: 'coche-manual', startTime: new Date('2026-05-27T15:00:00Z'), duration: 90, status: 'confirmed' },
    { id: 'r-0010', studentId: 's-0001', teacherId: 't-0004', vehicleType: 'coche-manual', startTime: new Date('2026-05-28T10:00:00Z'), duration: 45, status: 'completed' },
  ];

  for (const r of reservations) {
    console.log(`  Reservation ${r.id}: Student ${r.studentId} — Teacher ${r.teacherId} (${r.status})`);
    await prisma.reservation.upsert({
      where: { id: r.id },
      update: { status: r.status },
      create: r,
    });
  }

  console.log('\n✅ Seed complete!');
  console.log('   ─────────────────────────────────────');
  console.log('   Admin:   admin / admin123');
  console.log('   Teacher: jperez / teacher123');
  console.log('   Student: pgomez / student123');
  console.log('   ─────────────────────────────────────');
  console.log(`   Users:       1 admin + ${teachers.length} teachers + ${students.length} students`);
  console.log(`   Vehicles:    ${vehicles.length}`);
  console.log(`   Type Config: ${typeConfigs.length}`);
  console.log(`   Schedules:   ${schedules.length} teachers with availability`);
  console.log(`   Assignments: ${teacherVehicles.length} teacher-vehicle`);
  console.log(`   Reservations: ${reservations.length}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
