export interface NotificationSendParams {
  to: string;
  template: string;
  data: Record<string, unknown>;
}

export interface NotificationSendResult {
  success: boolean;
  error?: string;
}

export interface NotificationProvider {
  send(params: NotificationSendParams): Promise<NotificationSendResult>;
}
