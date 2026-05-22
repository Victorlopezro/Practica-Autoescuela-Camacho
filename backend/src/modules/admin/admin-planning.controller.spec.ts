import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/services/prisma.service';
import { SchedulingService } from '../scheduling/scheduling.service';
import { RuleEngineService } from '../scheduling/rule-engine.service';
import { AdminPlanningController } from './admin-planning.controller';

describe('AdminPlanningController', () => {
  let controller: AdminPlanningController;
  let prisma: any;
  let scheduling: any;
  let ruleEngine: any;

  const mockTeachers = [
    { id: 'teacher-1', name: 'John Doe', doubleSession: false },
    { id: 'teacher-2', name: 'Jane Smith', doubleSession: true },
  ];

  const mockAvailability = {
    teacherId: 'teacher-1',
    doubleSession: false,
    availability: [
      { id: 'av-1', teacherId: 'teacher-1', dayOfWeek: 1, startTime: '08:00', endTime: '14:00' },
      { id: 'av-2', teacherId: 'teacher-1', dayOfWeek: 2, startTime: '08:00', endTime: '14:00' },
      { id: 'av-3', teacherId: 'teacher-1', dayOfWeek: 3, startTime: '08:00', endTime: '14:00' },
      { id: 'av-4', teacherId: 'teacher-1', dayOfWeek: 4, startTime: '08:00', endTime: '14:00' },
    ],
    overrides: [],
  };

  const mockReservations = [
    {
      id: 'res-1',
      studentId: 'student-1',
      teacherId: 'teacher-1',
      vehicleType: 'coche-manual',
      startTime: new Date('2026-05-18T08:00:00Z'),
      duration: 45,
      status: 'confirmed',
    },
    {
      id: 'res-2',
      studentId: 'student-2',
      teacherId: 'teacher-1',
      vehicleType: 'coche-automatico',
      startTime: new Date('2026-05-18T09:00:00Z'),
      duration: 90,
      status: 'confirmed',
    },
  ];

  beforeEach(async () => {
    prisma = {
      teacher: {
        findMany: jest.fn(),
      },
      reservation: {
        findMany: jest.fn(),
      },
      student: {
        findMany: jest.fn(),
      },
      user: {
        findMany: jest.fn(),
      },
    };

    scheduling = {
      getTeacherAvailability: jest.fn(),
    };

    ruleEngine = {
      evaluateTeacherRules: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPlanningController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: SchedulingService, useValue: scheduling },
        { provide: RuleEngineService, useValue: ruleEngine },
      ],
    }).compile();

    controller = module.get<AdminPlanningController>(AdminPlanningController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPlanning', () => {
    it('should return planning for all teachers with default date range', async () => {
      prisma.teacher.findMany.mockResolvedValue(mockTeachers);
      scheduling.getTeacherAvailability
        .mockResolvedValueOnce(mockAvailability)
        .mockResolvedValueOnce({
          ...mockAvailability,
          teacherId: 'teacher-2',
          doubleSession: true,
          availability: [
            { id: 'av-3', teacherId: 'teacher-2', dayOfWeek: 1, startTime: '09:00', endTime: '15:00' },
          ],
          overrides: [],
        });
      prisma.reservation.findMany.mockResolvedValue(mockReservations);
      prisma.student.findMany.mockResolvedValue([
        { id: 'student-1', userId: 'user-1' },
        { id: 'student-2', userId: 'user-2' },
      ]);
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-1', name: 'Alice', lastName: 'Smith' },
        { id: 'user-2', name: null, lastName: null },
      ]);

      const result = await controller.getPlanning();

      expect(result.from).toBeDefined();
      expect(result.to).toBeDefined();
      expect(result.teachers).toHaveLength(2);
      expect(result.teachers[0].id).toBe('teacher-1');
      expect(result.teachers[0].doubleSession).toBe(false);
      expect(result.teachers[0].days).toBeDefined();
      expect(Array.isArray(result.teachers[0].days)).toBe(true);
    });

    it('should return planning with custom date range', async () => {
      prisma.teacher.findMany.mockResolvedValue([mockTeachers[0]]);
      scheduling.getTeacherAvailability.mockResolvedValue(mockAvailability);
      prisma.reservation.findMany.mockResolvedValue(mockReservations);
      prisma.student.findMany.mockResolvedValue([
        { id: 'student-1', userId: 'user-1' },
        { id: 'student-2', userId: 'user-2' },
      ]);
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-1', name: 'Alice', lastName: 'Smith' },
        { id: 'user-2', name: null, lastName: null },
      ]);

      const result = await controller.getPlanning('2026-05-18', '2026-05-20');

      expect(result.from).toBe('2026-05-18');
      expect(result.to).toBe('2026-05-20');
      expect(result.teachers).toHaveLength(1);
    });

    it('should include reservation details with student names', async () => {
      prisma.teacher.findMany.mockResolvedValue([mockTeachers[0]]);
      scheduling.getTeacherAvailability.mockResolvedValue(mockAvailability);
      prisma.reservation.findMany.mockResolvedValue(mockReservations);
      prisma.student.findMany.mockResolvedValue([
        { id: 'student-1', userId: 'user-1' },
        { id: 'student-2', userId: 'user-2' },
      ]);
      prisma.user.findMany.mockResolvedValue([
        { id: 'user-1', name: 'Alice', lastName: 'Smith' },
        { id: 'user-2', name: null, lastName: null },
      ]);

      const result = await controller.getPlanning('2026-05-18', '2026-05-18');

      const day = result.teachers[0].days.find(d => d.date === '2026-05-18');
      expect(day).toBeDefined();
      expect(day!.isAvailable).toBe(true);
      expect(day!.totalSlots).toBeGreaterThan(0);
      expect(day!.reservations).toHaveLength(2);

      // First reservation has student name
      expect(day!.reservations[0].student).toEqual({
        name: 'Alice',
        lastName: 'Smith',
      });

      // Second reservation has a student record with null name/lastName
      expect(day!.reservations[1].student).toEqual({
        name: null,
        lastName: null,
      });
    });

    it('should mark day as unavailable when override disables it', async () => {
      prisma.teacher.findMany.mockResolvedValue([mockTeachers[0]]);
      scheduling.getTeacherAvailability.mockResolvedValue({
        ...mockAvailability,
        overrides: [
          {
            id: 'ov-1',
            teacherId: 'teacher-1',
            date: new Date('2026-05-18'),
            isAvailable: false,
            startTime: null,
            endTime: null,
            reason: 'Doctor appointment',
          },
        ],
      });
      prisma.reservation.findMany.mockResolvedValue([]);
      prisma.student.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);

      const result = await controller.getPlanning('2026-05-18', '2026-05-18');

      const day = result.teachers[0].days[0];
      expect(day.isAvailable).toBe(false);
      expect(day.reason).toBe('Doctor appointment');
      expect(day.totalSlots).toBe(0);
      expect(day.freeSlots).toBe(0);
    });

    it('should calculate booked and free slots correctly', async () => {
      prisma.teacher.findMany.mockResolvedValue([mockTeachers[0]]);
      scheduling.getTeacherAvailability.mockResolvedValue(mockAvailability);
      prisma.reservation.findMany.mockResolvedValue(mockReservations);
      prisma.student.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);

      const result = await controller.getPlanning('2026-05-18', '2026-05-18');

      const day = result.teachers[0].days[0];
      // 08:00 to 14:00 = 360 min, 360/45 = 8 total slots
      expect(day!.totalSlots).toBe(8);
      // res-1: duration 45, ceil(45/45) = 1 slot
      // res-2: duration 90, ceil(90/45) = 2 slots
      expect(day!.bookedSlots).toBe(3);
      expect(day!.freeSlots).toBe(5);
    });
  });
});
