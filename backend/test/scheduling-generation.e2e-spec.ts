import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/common/services/prisma.service';

/**
 * E2E test for the generation rules lifecycle.
 *
 * These tests connect to the real database configured via DATABASE_URL.
 * They create test data, run HTTP requests, verify DB state, and clean up.
 *
 * Run with: pnpm test:e2e
 * Requires: a running Postgres database with schema migrated.
 */
describe('Scheduling Generation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const testId = randomUUID().slice(0, 8);
  const testUsername = `e2e-gen-${testId}`;
  const testPassword = 'test123456';
  const testTeacherName = `E2E Teacher ${testId}`;
  let testUserId: string;
  let testTeacherId: string;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();

    // Create test teacher
    const teacher = await prisma.teacher.create({
      data: { name: testTeacherName },
    });
    testTeacherId = teacher.id;

    // Create test admin user
    const hashed = await argon2.hash(testPassword);
    const user = await prisma.user.create({
      data: {
        username: testUsername,
        password: hashed,
        role: 'admin',
        name: 'E2E',
        lastName: 'Admin',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      await prisma.refreshToken.deleteMany({ where: { userId: testUserId } });
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
    if (testTeacherId) {
      await prisma.teacherAvailability.deleteMany({
        where: { teacherId: testTeacherId },
      });
      await prisma.teacher.delete({ where: { id: testTeacherId } }).catch(() => {});
    }
    await app.close();
  });

  describe('POST /v1/scheduling/rules — generation flow', () => {
    it('should login as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/auth/login')
        .send({ username: testUsername, password: testPassword })
        .expect(200);

      expect(res.body.accessToken).toBeDefined();
      expect(res.body.user.role).toBe('admin');
      accessToken = res.body.accessToken;
    });

    it('should create a generation rule and generate teacher_availability rows', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/scheduling/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `E2E Generation Rule ${testId}`,
          naturalLanguage: `${testTeacherName} lunes a viernes de 08:00 a 15:00`,
          category: 'generation',
          priority: 50,
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.category).toBe('generation');
      expect(res.body.data.id).toBeDefined();
      expect(res.body.generationResult).toBeDefined();

      // Verify rows were created in the database
      const rows = await prisma.teacherAvailability.findMany({
        where: { ruleId: res.body.data.id },
      });
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.length).toBe(res.body.generationResult.generatedRows);
      expect(rows[0].teacherId).toBe(testTeacherId);
      expect((rows[0] as Record<string, unknown>).isAvailable).toBe(true);
      expect(rows[0].ruleId).toBe(res.body.data.id);

      // Cleanup the created rule + its availability rows
      await prisma.schedulingRule.delete({
        where: { id: res.body.data.id },
      });
    });

    it('should generate scheduleData-only generation rule (fallback without AI)', async () => {
      // This test bypasses AI by not sending naturalLanguage
      // Instead it sends scheduleData directly
      const res = await request(app.getHttpServer())
        .post('/v1/scheduling/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `E2E Gen Rule Manual ${testId}`,
          naturalLanguage: `Horario manual para ${testTeacherName}`,
          category: 'generation',
          priority: 60,
          scheduleData: [
            {
              teacher: testTeacherName,
              schedule: [
                { dayOfWeek: 1, startTime: '09:00', endTime: '14:00' },
                { dayOfWeek: 3, startTime: '09:00', endTime: '14:00' },
              ],
            },
          ],
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.generationResult.generatedRows).toBe(2);

      // Verify DB state
      const rows = await prisma.teacherAvailability.findMany({
        where: { ruleId: res.body.data.id },
      });
      expect(rows).toHaveLength(2);
      expect(rows.map((r) => r.dayOfWeek).sort()).toEqual([1, 3]);

      // Cleanup
      await prisma.schedulingRule.delete({
        where: { id: res.body.data.id },
      });
    });

    it('should reject unauthenticated requests', async () => {
      await request(app.getHttpServer())
        .post('/v1/scheduling/rules')
        .send({
          name: 'Unauthorized Rule',
          naturalLanguage: 'Test teacher lunes a viernes',
          category: 'generation',
        })
        .expect(401);
    });
  });

  describe('DELETE /v1/scheduling/rules/:id — generation cleanup', () => {
    it('should remove teacher_availability rows when deleting a generation rule', async () => {
      // Create rule first
      const createRes = await request(app.getHttpServer())
        .post('/v1/scheduling/rules')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `E2E Delete Test ${testId}`,
          naturalLanguage: `${testTeacherName} lunes a viernes de 10:00 a 12:00`,
          category: 'generation',
          priority: 70,
        })
        .expect(201);

      const ruleId = createRes.body.data.id;
      const initialRows = await prisma.teacherAvailability.findMany({
        where: { ruleId },
      });
      expect(initialRows.length).toBeGreaterThan(0);

      // Delete the rule
      const delRes = await request(app.getHttpServer())
        .delete(`/v1/scheduling/rules/${ruleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(delRes.body.generationRemoval.deletedRows).toBeGreaterThan(0);

      // Verify rows are gone
      const remainingRows = await prisma.teacherAvailability.findMany({
        where: { ruleId },
      });
      expect(remainingRows).toHaveLength(0);
    });
  });
});
