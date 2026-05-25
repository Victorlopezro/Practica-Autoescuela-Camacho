import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/services/prisma.service';
import {
  CreateSchedulingRuleDto,
  UpdateSchedulingRuleDto,
  SchedulingRuleQueryDto,
} from '../dto';
import { RuleChangedEvent } from '../events/rule-changed.event';

@Injectable()
export class SchedulingRulesService {
  private readonly logger = new Logger(SchedulingRulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async create(dto: CreateSchedulingRuleDto, userId: string) {
    const rule = await this.prisma.schedulingRule.create({
      data: {
        name: dto.name,
        naturalLanguage: dto.naturalLanguage,
        structuredRules:
          (dto.structuredRules as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        ruleType: dto.ruleType,
        action: dto.action ?? 'block',
        priority: dto.priority ?? 100,
        enabled: dto.enabled ?? true,
        appliesTo: (dto.appliesTo as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        createdById: userId,
      },
    });

    this.eventBus.publish(new RuleChangedEvent(rule.id, 'created'));
    return rule;
  }

  async findAll(query: SchedulingRuleQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SchedulingRuleWhereInput = {
      deletedAt: null,
    };

    if (query.ruleType) {
      where.ruleType = query.ruleType;
    }

    if (query.enabled !== undefined) {
      where.enabled = query.enabled === 'true';
    }

    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.schedulingRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { priority: 'asc' },
      }),
      this.prisma.schedulingRule.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const rule = await this.prisma.schedulingRule.findFirst({
      where: { id, deletedAt: null },
    });

    if (!rule) {
      throw new NotFoundException('Scheduling rule not found');
    }

    return rule;
  }

  async update(id: string, dto: UpdateSchedulingRuleDto) {
    await this.findOne(id); // ensures it exists and is not soft-deleted

    const data: Prisma.SchedulingRuleUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.ruleType !== undefined) data.ruleType = dto.ruleType;
    if (dto.structuredRules !== undefined)
      data.structuredRules = dto.structuredRules as Prisma.InputJsonValue;
    if (dto.action !== undefined) data.action = dto.action;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.enabled !== undefined) data.enabled = dto.enabled;
    if (dto.appliesTo !== undefined)
      data.appliesTo = dto.appliesTo as Prisma.InputJsonValue;

    const rule = await this.prisma.schedulingRule.update({
      where: { id },
      data,
    });

    this.eventBus.publish(new RuleChangedEvent(rule.id, 'updated'));
    return rule;
  }

  async findAllActive() {
    return this.prisma.schedulingRule.findMany({
      where: { enabled: true, deletedAt: null },
      orderBy: { priority: 'asc' },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // ensures it exists and is not soft-deleted

    await this.prisma.schedulingRule.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.eventBus.publish(new RuleChangedEvent(id, 'deleted'));
  }
}
