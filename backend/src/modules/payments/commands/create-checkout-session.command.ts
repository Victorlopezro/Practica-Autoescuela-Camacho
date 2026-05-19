export class CreateCheckoutSessionCommand {
  constructor(
    public readonly reservationId: string,
  ) {}
}
