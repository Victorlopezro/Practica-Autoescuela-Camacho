export class HandleStripeWebhookCommand {
  constructor(
    public readonly rawBody: string,
    public readonly signature: string,
  ) {}
}
