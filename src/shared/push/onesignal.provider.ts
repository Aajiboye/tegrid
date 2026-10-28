import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { IPushProvider, PushNotification } from './push-provider.interface';

@Injectable()
export class OneSignalPushProvider implements IPushProvider {
  readonly name = 'onesignal';
  private readonly logger = new Logger(OneSignalPushProvider.name);
  private appId: string;
  private apiKey: string;
  private apiUrl = 'https://onesignal.com/api/v1/notifications';

  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID || '';
    this.apiKey = process.env.ONESIGNAL_API_KEY || '';
  }

  private hasConfig() {
    return !!this.appId && !!this.apiKey;
  }

  async sendToDeviceIds(deviceIds: string[], notification: PushNotification): Promise<any> {
    if (!this.hasConfig()) {
      this.logger.warn('OneSignal not configured; skipping push send');
      return;
    }

    if (!deviceIds || deviceIds.length === 0) return;

    const payload: any = {
      app_id: this.appId,
      include_player_ids: deviceIds,
      headings: { en: notification.heading },
      contents: { en: notification.message },
    };

    if (notification.data) payload.data = notification.data;

    try {
      this.logger.log(`Sending OneSignal push to ${deviceIds.length} device(s): ${notification.heading}`);
      const resp = await axios.post(this.apiUrl, payload, {
        headers: {
          Authorization: `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      this.logger.log(`OneSignal send success: ${resp.status} (${resp.data?.id ?? 'no-id'})`);
      return resp.data;
    } catch (err) {
      this.logger.error('Failed to send push via OneSignal', err?.response?.data || err.message || err);
    }
  }
}
