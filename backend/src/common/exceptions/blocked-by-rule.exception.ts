import { ConflictException } from '@nestjs/common';
import type { RuleEvaluation } from '../../modules/scheduling/rule-engine.service';

export class BlockedByRuleException extends ConflictException {
  constructor(public readonly evaluations: RuleEvaluation[]) {
    const reasons = evaluations.map((e) => e.reason).join('; ');
    super(`Reserva bloqueada por reglas de scheduling: ${reasons}`);
  }
}
