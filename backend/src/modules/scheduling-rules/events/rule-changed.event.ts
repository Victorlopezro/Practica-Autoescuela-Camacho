export class RuleChangedEvent {
  constructor(
    public readonly ruleId: string,
    public readonly changeType: 'created' | 'updated' | 'deleted' | 'toggled',
  ) {}
}
