import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/services/prisma.service';
import {
  SchedulingAiService,
  AiGenerationTranslationResult,
} from './scheduling-ai.service';

describe('SchedulingAiService', () => {
  let service: SchedulingAiService;
  let prisma: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {};

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'OPENROUTER_API_KEY') return 'test-api-key';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulingAiService,
        { provide: ConfigService, useValue: configService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SchedulingAiService>(SchedulingAiService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ──────────────────────────────────────────────
  //  translateGenerationRule — unit tests
  // ──────────────────────────────────────────────

  describe('translateGenerationRule', () => {
    const makeAiResponse = (rawContent: string) => ({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: rawContent } }],
      }),
      text: jest.fn(),
    });

    const makeFailedResponse = (status: number, body: string) => ({
      ok: false,
      status,
      text: jest.fn().mockResolvedValue(body),
      json: jest.fn(),
    });

    it('should parse a valid AI response for "Luis López 8:00-15:00"', async () => {
      const aiJson = JSON.stringify({
        schedule: [
          {
            teacher: 'Luis López',
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '15:00',
            track: null,
          },
        ],
      });

      global.fetch = jest
        .fn()
        .mockResolvedValue(makeAiResponse(aiJson));

      const result = await service.translateGenerationRule(
        'El horario de Luis López es de 8:00 a 15:00',
      );

      expect(result.error).toBeUndefined();
      expect(result.schedule).toHaveLength(1);
      expect(result.schedule[0].teacher).toBe('Luis López');
      expect(result.schedule[0].daysOfWeek).toEqual([1, 2, 3, 4, 5]);
      expect(result.schedule[0].startTime).toBe('08:00');
      expect(result.schedule[0].endTime).toBe('15:00');
      expect(result.schedule[0].track).toBeNull();
    });

    it('should parse specific days and track for "Mario lunes/miércoles/viernes pista"', async () => {
      const aiJson = JSON.stringify({
        schedule: [
          {
            teacher: 'Mario García',
            daysOfWeek: [1, 3, 5],
            startTime: '10:00',
            endTime: '14:00',
            track: 'pista',
          },
        ],
      });

      global.fetch = jest
        .fn()
        .mockResolvedValue(makeAiResponse(aiJson));

      const result = await service.translateGenerationRule(
        'Los lunes, miércoles y viernes Mario da clase de 10:00 a 14:00 en pista',
      );

      expect(result.error).toBeUndefined();
      expect(result.schedule).toHaveLength(1);
      expect(result.schedule[0].teacher).toBe('Mario García');
      expect(result.schedule[0].daysOfWeek).toEqual([1, 3, 5]);
      expect(result.schedule[0].startTime).toBe('10:00');
      expect(result.schedule[0].endTime).toBe('14:00');
      expect(result.schedule[0].track).toBe('pista');
    });

    it('should parse weekends for "Juan fines de semana 9:00-13:00"', async () => {
      const aiJson = JSON.stringify({
        schedule: [
          {
            teacher: 'Juan Pérez',
            daysOfWeek: [0, 6],
            startTime: '09:00',
            endTime: '13:00',
            track: null,
          },
        ],
      });

      global.fetch = jest
        .fn()
        .mockResolvedValue(makeAiResponse(aiJson));

      const result = await service.translateGenerationRule(
        'Juan solamente los fines de semana de 9:00 a 13:00',
      );

      expect(result.error).toBeUndefined();
      expect(result.schedule).toHaveLength(1);
      expect(result.schedule[0].teacher).toBe('Juan Pérez');
      expect(result.schedule[0].daysOfWeek).toEqual([0, 6]);
      expect(result.schedule[0].startTime).toBe('09:00');
      expect(result.schedule[0].endTime).toBe('13:00');
    });

    it('should handle multiple schedule items', async () => {
      const aiJson = JSON.stringify({
        schedule: [
          {
            teacher: 'Luis López',
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '15:00',
            track: 'pista',
          },
          {
            teacher: 'Mario García',
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '15:00',
            track: 'circulacion',
          },
        ],
      });

      global.fetch = jest
        .fn()
        .mockResolvedValue(makeAiResponse(aiJson));

      const result = await service.translateGenerationRule(
        'Luis da pista de 8 a 15 y Mario circulación de 8 a 15, entre semana',
      );

      expect(result.error).toBeUndefined();
      expect(result.schedule).toHaveLength(2);
      expect(result.schedule[0].track).toBe('pista');
      expect(result.schedule[1].track).toBe('circulacion');
    });

    it('should return error when AI response has invalid JSON', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(makeAiResponse('Esto no es JSON'));

      const result = await service.translateGenerationRule(
        'Cualquier texto',
      );

      expect(result.error).toBeDefined();
      expect(result.schedule).toEqual([]);
    });

    it('should return error when AI response has no schedule array', async () => {
      const aiJson = JSON.stringify({ foo: 'bar' });

      global.fetch = jest
        .fn()
        .mockResolvedValue(makeAiResponse(aiJson));

      const result = await service.translateGenerationRule(
        'Cualquier texto',
      );

      expect(result.error).toContain('schedule');
      expect(result.schedule).toEqual([]);
    });

    it('should return error when AI response has incomplete items', async () => {
      const aiJson = JSON.stringify({
        schedule: [
          {
            teacher: 'Luis López',
            // missing daysOfWeek, startTime, endTime
          },
        ],
      });

      global.fetch = jest
        .fn()
        .mockResolvedValue(makeAiResponse(aiJson));

      const result = await service.translateGenerationRule(
        'Cualquier texto',
      );

      expect(result.error).toContain('incompletos');
      expect(result.schedule).toEqual([]);
    });

    it('should return error when AI service returns non-200', async () => {
      global.fetch = jest
        .fn()
        .mockResolvedValue(makeFailedResponse(429, 'Rate limited'));

      const result = await service.translateGenerationRule(
        'Cualquier texto',
      );

      expect(result.error).toBeDefined();
      expect(result.error).toContain('429');
      expect(result.schedule).toEqual([]);
    });

    it('should return error on network failure', async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error('Network timeout'));

      const result = await service.translateGenerationRule(
        'Cualquier texto',
      );

      expect(result.error).toBeDefined();
      expect(result.schedule).toEqual([]);
    });

    it('should handle markdown code fences in AI response', async () => {
      const aiJson = '```json\n{"schedule": [{"teacher": "Luis López", "daysOfWeek": [1,2,3,4,5], "startTime": "08:00", "endTime": "15:00", "track": null}]}\n```';

      global.fetch = jest
        .fn()
        .mockResolvedValue(makeAiResponse(aiJson));

      const result = await service.translateGenerationRule(
        'El horario de Luis López es de 8:00 a 15:00',
      );

      expect(result.error).toBeUndefined();
      expect(result.schedule).toHaveLength(1);
      expect(result.schedule[0].teacher).toBe('Luis López');
    });
  });
});
