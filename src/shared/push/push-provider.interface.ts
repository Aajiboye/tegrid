export interface PushNotification {
  heading: string;
  message: string;
  data?: Record<string, any>;
}

export interface IPushProvider {
  readonly name: string;

  sendToDeviceIds(
    deviceIds: string[],
    notification: PushNotification,
  ): Promise<any>;
}

export const PUSH_PROVIDER = Symbol('PUSH_PROVIDER');
