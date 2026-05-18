import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let configService: any;

  beforeEach(async () => {
    configService = { getOrThrow: jest.fn() };
  });

  it('should be defined', async () => {
    configService.getOrThrow.mockReturnValue(
      'postgresql://postgres:postgres@localhost:5432/autoescuela',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    const service = module.get<PrismaService>(PrismaService);
    expect(service).toBeDefined();
  });
});
