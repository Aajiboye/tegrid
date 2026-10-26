import { Injectable, Logger } from '@nestjs/common';
import { IPushProvider, PushNotification } from './push-provider.interface';

@Injectable()
export class NoopPushProvider implements IPushProvider {
  readonly name = 'noop';
  private readonly logger = new Logger(NoopPushProvider.name);

  async sendToDeviceIds(deviceIds: string[], notification: PushNotification): Promise<any> {
    this.logger.debug(
      `[NoopPushProvider] Would send to ${deviceIds.length} device(s): ${notification.heading}`,
    );
    return { skipped: true };
  }
}
