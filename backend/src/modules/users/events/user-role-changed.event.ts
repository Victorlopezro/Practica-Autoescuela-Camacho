import { IEvent } from '@nestjs/cqrs';

export class UserRoleChangedEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly oldRole: string,
    public readonly newRole: string,
    public readonly changedBy?: string,
  ) {}
}
