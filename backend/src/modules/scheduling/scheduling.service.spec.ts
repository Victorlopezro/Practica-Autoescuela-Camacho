import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { SchedulingService } from './scheduling.service';
import { RuleEngineService } from './rule-engine.service';

describe('SchedulingService', () => {
  let service: SchedulingService;
  let prisma: any;
  let ruleEngine: any;

  beforeEach(async () => {
    prisma = {
      teacher: {
        findUnique: jest.fn(),
      },
      teacherAvailability: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      availabilityOverride: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      reservation: {
        findMany: jest.fn(),
      },
      student: {
        findUnique: jest.fn(),
      },
      vehicleTypeConfig: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    ruleEngine = {
      getGenerationRules: jest.fn().mockResolvedValue([]),
      canCreateReservation: jest
        .fn()
        .mockResolvedValue({ blocked: false, warnings: [] }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingService,
        { provide: PrismaService, useValue: prisma },
        { provide: RuleEngineService, useValue: ruleEngine },
      ],
    }).compile();

    service = module.get<SchedulingService>(SchedulingService);
    jest.clearAllMocks();
  });

  // ────────────────────────────────────────────
  //  batchSetOverrides
  // ────────────────────────────────────────────

  describe('batchSetOverrides', () => {
    const validOverride = {
      date: '2026-06-01',
      isAvailable: false,
    };

    const multipleOverrides = [
      { date: '2026-06-01', isAvailable: true, startTime: '09:00', endTime: '14:00' },
      { date: '2026-06-02', isAvailable: false },
      { date: '2026-06-03', isAvailable: true, startTime: '10:00', endTime: '12:00', reason: 'Feriado local' },
    ];

    it('should throw BadRequestException when overrides array is empty', async () => {
      await expect(
        service.batchSetOverrides('teacher-1', []),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when teacher does not exist', async () => {
      prisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.batchSetOverrides('teacher-1', [validOverride]),
      ).rejects.toThrow(NotFoundException);
    });

    it('should call $transaction with upsert for each override', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1', doubleSession: false });
      prisma.$transaction.mockImplementation((ops) => Promise.all(ops));

      await service.batchSetOverrides('teacher-1', multipleOverrides);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.availabilityOverride.upsert).toHaveBeenCalledTimes(3);
    });

    it('should pass correct where/create/update to each upsert', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1', doubleSession: false });
      prisma.$transaction.mockImplementation((ops) => Promise.all(ops));

      await service.batchSetOverrides('teacher-1', multipleOverrides);

      // First override: available with custom hours
      expect(prisma.availabilityOverride.upsert).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          where: {
            teacherId_date: { teacherId: 'teacher-1', date: expect.any(Date) },
          },
          create: expect.objectContaining({
            teacherId: 'teacher-1',
            isAvailable: true,
            startTime: '09:00',
            endTime: '14:00',
          }),
          update: expect.objectContaining({
            isAvailable: true,
            startTime: '09:00',
            endTime: '14:00',
          }),
        }),
      );

      // Second override: unavailable — times should be null
      expect(prisma.availabilityOverride.upsert).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          create: expect.objectContaining({
            isAvailable: false,
            startTime: null,
            endTime: null,
          }),
          update: expect.objectContaining({
            isAvailable: false,
            startTime: null,
            endTime: null,
          }),
        }),
      );

      // Third override: available with reason
      expect(prisma.availabilityOverride.upsert).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          create: expect.objectContaining({
            isAvailable: true,
            startTime: '10:00',
            endTime: '12:00',
            reason: 'Feriado local',
          }),
          update: expect.objectContaining({
            isAvailable: true,
            startTime: '10:00',
            endTime: '12:00',
            reason: 'Feriado local',
          }),
        }),
      );
    });

    it('should throw BadRequestException for invalid startTime format', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1', doubleSession: false });

      await expect(
        service.batchSetOverrides('teacher-1', [
          { date: '2026-06-01', isAvailable: true, startTime: '25:00', endTime: '14:00' },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when endTime is before startTime', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1', doubleSession: false });

      await expect(
        service.batchSetOverrides('teacher-1', [
          { date: '2026-06-01', isAvailable: true, startTime: '14:00', endTime: '09:00' },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return the transaction result', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1', doubleSession: false });
      const expectedResult = [{ id: 'override-1' }, { id: 'override-2' }];
      prisma.$transaction.mockResolvedValue(expectedResult);

      const result = await service.batchSetOverrides('teacher-1', [
        { date: '2026-06-01', isAvailable: true },
        { date: '2026-06-02', isAvailable: false },
      ]);

      expect(result).toEqual(expectedResult);
    });
  });

  // ────────────────────────────────────────────
  //  copyWeekOverrides
  // ────────────────────────────────────────────

  describe('copyWeekOverrides', () => {
    const sourceDate = '2026-06-01'; // Monday
    const targetDate = '2026-06-08'; // Next Monday

    const sourceOverrides = [
      {
        id: 'ov-1',
        teacherId: 'teacher-1',
        date: new Date('2026-06-01'),
        isAvailable: false,
        startTime: null,
        endTime: null,
        reason: null,
        createdAt: new Date(),
      },
      {
        id: 'ov-2',
        teacherId: 'teacher-1',
        date: new Date('2026-06-03'),
        isAvailable: true,
        startTime: '09:00',
        endTime: '14:00',
        reason: 'Feriado',
        createdAt: new Date(),
      },
    ];

    it('should throw NotFoundException when teacher does not exist', async () => {
      prisma.teacher.findUnique.mockResolvedValue(null);

      await expect(
        service.copyWeekOverrides('teacher-1', sourceDate, targetDate),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return copied=0 when source week has no overrides', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1', doubleSession: false });
      prisma.availabilityOverride.findMany.mockResolvedValue([]);

      const result = await service.copyWeekOverrides('teacher-1', sourceDate, targetDate);

      expect(result).toEqual({ copied: 0 });
      expect(prisma.availabilityOverride.findMany).toHaveBeenCalledTimes(1);
    });

    it('should copy source overrides to target week with shifted dates', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1', doubleSession: false });
      prisma.availabilityOverride.findMany
        .mockResolvedValueOnce(sourceOverrides)  // source fetch
        .mockResolvedValueOnce([]);               // target fetch (no existing)

      await service.copyWeekOverrides('teacher-1', sourceDate, targetDate);

      // Should upsert 2 overrides
      expect(prisma.availabilityOverride.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);

      // First upsert: source 2026-06-01 → target 2026-06-08
      const firstCall = prisma.availabilityOverride.upsert.mock.calls[0][0];
      expect(firstCall.where.teacherId_date.teacherId).toBe('teacher-1');
      expect(firstCall.create.isAvailable).toBe(false);
      expect(firstCall.create.startTime).toBeNull();
      expect(firstCall.create.reason).toBeNull();

      // Second upsert: source 2026-06-03 → target 2026-06-10
      const secondCall = prisma.availabilityOverride.upsert.mock.calls[1][0];
      expect(secondCall.create.isAvailable).toBe(true);
      expect(secondCall.create.startTime).toBe('09:00');
      expect(secondCall.create.endTime).toBe('14:00');
      expect(secondCall.create.reason).toBe('Feriado');
    });

    it('should skip target dates that already have overrides when overrideExisting is false', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1', doubleSession: false });
      // Source overrides (June 1 and June 3)
      prisma.availabilityOverride.findMany
        .mockResolvedValueOnce(sourceOverrides)
        // Target already has an override for June 10 (which maps from June 3)
        .mockResolvedValueOnce([
          {
            id: 'existing-1',
            teacherId: 'teacher-1',
            date: new Date('2026-06-10'),
            isAvailable: true,
            startTime: '08:00',
            endTime: '12:00',
            reason: 'Existing',
            createdAt: new Date(),
          },
        ]);

      await service.copyWeekOverrides('teacher-1', sourceDate, targetDate, false);

      // June 1 → June 8: no existing → should upsert
      // June 3 → June 10: existing → should skip
      expect(prisma.availabilityOverride.upsert).toHaveBeenCalledTimes(1);
    });

    it('should overwrite target dates when overrideExisting is true', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1', doubleSession: false });
      // Source overrides (June 1 and June 3, same as above)
      prisma.availabilityOverride.findMany
        .mockResolvedValueOnce(sourceOverrides)
        // Target already has an override for June 10
        .mockResolvedValueOnce([
          {
            id: 'existing-1',
            teacherId: 'teacher-1',
            date: new Date('2026-06-10'),
            isAvailable: true,
            startTime: '08:00',
            endTime: '12:00',
            reason: 'Existing',
            createdAt: new Date(),
          },
        ]);

      await service.copyWeekOverrides('teacher-1', sourceDate, targetDate, true);

      // Both should be upserted (overwriting the existing one)
      expect(prisma.availabilityOverride.upsert).toHaveBeenCalledTimes(2);
    });

    it('should return the correct copy count', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1', doubleSession: false });
      prisma.availabilityOverride.findMany
        .mockResolvedValueOnce(sourceOverrides)
        .mockResolvedValueOnce([]);
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.copyWeekOverrides('teacher-1', sourceDate, targetDate);

      expect(result).toEqual({ copied: 2 });
    });

    it('should not call $transaction when all target dates are skipped', async () => {
      prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1', doubleSession: false });
      // Both source dates have matching target overrides
      prisma.availabilityOverride.findMany
        .mockResolvedValueOnce(sourceOverrides)
        .mockResolvedValueOnce([
          {
            id: 'existing-1',
            teacherId: 'teacher-1',
            date: new Date('2026-06-08'),
            isAvailable: true,
            startTime: '08:00',
            endTime: '12:00',
            reason: null,
            createdAt: new Date(),
          },
          {
            id: 'existing-2',
            teacherId: 'teacher-1',
            date: new Date('2026-06-10'),
            isAvailable: true,
            startTime: '09:00',
            endTime: '13:00',
            reason: null,
            createdAt: new Date(),
          },
        ]);

      await service.copyWeekOverrides('teacher-1', sourceDate, targetDate, false);

      expect(prisma.availabilityOverride.upsert).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────
  //  setAvailability — overlap validation
  // ────────────────────────────────────────────

  describe('setAvailability overlap validation', () => {
    const mockTeacher = { id: 'teacher-1', doubleSession: false };

    it('should reject time range overlapping with another track on same day', async () => {
      prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      prisma.teacherAvailability.findMany.mockResolvedValue([
        { id: 'avail-1', teacherId: 'teacher-1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', track: 'pista' },
      ]);
      prisma.teacherAvailability.findFirst.mockResolvedValue(null);

      await expect(
        service.setAvailability('teacher-1', 1, '10:00', '11:00', 'circulacion'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow non-overlapping time on another track', async () => {
      prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      prisma.teacherAvailability.findMany.mockResolvedValue([
        { id: 'avail-1', teacherId: 'teacher-1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', track: 'pista' },
      ]);
      prisma.teacherAvailability.findFirst.mockResolvedValue(null);
      prisma.teacherAvailability.create.mockResolvedValue({ id: 'avail-2', teacherId: 'teacher-1', dayOfWeek: 1, startTime: '13:00', endTime: '15:00', track: 'circulacion' });

      const result = await service.setAvailability('teacher-1', 1, '13:00', '15:00', 'circulacion');

      expect(prisma.teacherAvailability.create).toHaveBeenCalledWith({
        data: { teacherId: 'teacher-1', dayOfWeek: 1, startTime: '13:00', endTime: '15:00', track: 'circulacion' },
      });
      expect(result).toEqual(expect.objectContaining({ id: 'avail-2' }));
    });

    it('should allow same track update (overwrite existing)', async () => {
      prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      prisma.teacherAvailability.findMany.mockResolvedValue([
        { id: 'avail-1', teacherId: 'teacher-1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', track: 'pista' },
      ]);
      prisma.teacherAvailability.findFirst.mockResolvedValue({ id: 'avail-1', track: 'pista' });
      prisma.teacherAvailability.update.mockResolvedValue({ id: 'avail-1', teacherId: 'teacher-1', dayOfWeek: 1, startTime: '09:00', endTime: '14:00', track: 'pista' });

      const result = await service.setAvailability('teacher-1', 1, '09:00', '14:00', 'pista');

      expect(prisma.teacherAvailability.update).toHaveBeenCalledWith({
        where: { id: 'avail-1' },
        data: { startTime: '09:00', endTime: '14:00' },
      });
      expect(result).toEqual(expect.objectContaining({ startTime: '09:00', endTime: '14:00' }));
    });

    it('should allow setting availability without track (backward compat)', async () => {
      prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      prisma.teacherAvailability.findMany.mockResolvedValue([]);
      prisma.teacherAvailability.findFirst.mockResolvedValue(null);
      prisma.teacherAvailability.create.mockResolvedValue({ id: 'avail-3', teacherId: 'teacher-1', dayOfWeek: 2, startTime: '08:00', endTime: '14:00', track: null });

      const result = await service.setAvailability('teacher-1', 2, '08:00', '14:00');

      expect(prisma.teacherAvailability.create).toHaveBeenCalledWith({
        data: { teacherId: 'teacher-1', dayOfWeek: 2, startTime: '08:00', endTime: '14:00', track: undefined },
      });
      expect(result).toEqual(expect.objectContaining({ id: 'avail-3' }));
    });
  });

  // ────────────────────────────────────────────
  //  getAvailableSlotsInRange — track filtering
  // ────────────────────────────────────────────

  describe('getAvailableSlotsInRange track filtering', () => {
    const mockTeacher = { id: 'teacher-1', doubleSession: false };
    const mockTypeConfig = { type: 'moto-pista', duration: 30 };

    it('should filter by pista track when student has licenseSubType=pista', async () => {
      prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      prisma.vehicleTypeConfig.findUnique.mockResolvedValue(mockTypeConfig);
      prisma.student.findUnique.mockResolvedValue({ id: 'student-1', licenseSubType: 'pista', licenseType: 'A2' });
      prisma.teacherAvailability.findMany.mockResolvedValue([
        { id: 'avail-1', teacherId: 'teacher-1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', track: 'pista' },
        { id: 'avail-2', teacherId: 'teacher-1', dayOfWeek: 1, startTime: '13:00', endTime: '15:00', track: 'circulacion' },
      ]);
      prisma.availabilityOverride.findMany.mockResolvedValue([]);
      prisma.reservation.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlotsInRange(
        'teacher-1', '2026-06-01', 7, 'moto-pista', false, 'student-1',
      );

      // Should return 7 days
      expect(result.days).toHaveLength(7);
      // First day (Monday, day 1) should have pista slots (09:00-12:00 ≈ 6 slots)
      const firstDay = result.days[0];
      expect(firstDay.slots.length).toBeGreaterThan(0);
      expect(firstDay.slotDuration).toBe(30);
    });

    it('should use null-track availability when no track-specific entries exist', async () => {
      prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      prisma.vehicleTypeConfig.findUnique.mockResolvedValue(mockTypeConfig);
      prisma.student.findUnique.mockResolvedValue({ id: 'student-1', licenseSubType: 'pista', licenseType: 'A2' });
      prisma.teacherAvailability.findMany.mockResolvedValue([
        { id: 'avail-1', teacherId: 'teacher-1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', track: null },
      ]);
      prisma.availabilityOverride.findMany.mockResolvedValue([]);
      prisma.reservation.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlotsInRange(
        'teacher-1', '2026-06-01', 7, 'moto-pista', false, 'student-1',
      );

      expect(result.days).toHaveLength(7);
      const firstDay = result.days[0];
      expect(firstDay.slots.length).toBeGreaterThan(0);
    });

    it('should fall back to null-track availability when no licenseSubType', async () => {
      prisma.teacher.findUnique.mockResolvedValue(mockTeacher);
      prisma.vehicleTypeConfig.findUnique.mockResolvedValue(mockTypeConfig);
      prisma.student.findUnique.mockResolvedValue({ id: 'student-1', licenseSubType: null, licenseType: 'B' });
      prisma.teacherAvailability.findMany.mockResolvedValue([
        { id: 'avail-1', teacherId: 'teacher-1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', track: null },
      ]);
      prisma.availabilityOverride.findMany.mockResolvedValue([]);
      prisma.reservation.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlotsInRange(
        'teacher-1', '2026-06-01', 7, 'moto-pista', false, 'student-1',
      );

      expect(result.days).toHaveLength(7);
      const firstDay = result.days[0];
      expect(firstDay.slots.length).toBeGreaterThan(0);
    });
  });
});
