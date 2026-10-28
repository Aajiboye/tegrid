import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { IPushProvider, PushNotification, PUSH_PROVIDER } from '../push/push-provider.interface';
import { NoopPushProvider } from '../push/noop.provider';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    @Optional()
    @Inject(PUSH_PROVIDER)
    private readonly provider: IPushProvider,
  ) {
    if (!this.provider) {
      this.logger.warn('No push provider registered; push notifications will be no-ops');
      this.provider = new NoopPushProvider();
    }
  }

  async sendToDeviceIds(
    deviceIds: string[],
    heading: string,
    message: string,
    data?: Record<string, any>,
  ) {
    return this.provider.sendToDeviceIds(deviceIds, { heading, message, data });
  }

  async sendToDeviceIdsRaw(deviceIds: string[], notification: PushNotification) {
    return this.provider.sendToDeviceIds(deviceIds, notification);
  }
}
