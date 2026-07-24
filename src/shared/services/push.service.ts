import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

const logger = new Logger('PushService');

@Injectable()
export class PushService {
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

  async sendToDeviceIds(deviceIds: string[], heading: string, message: string, data?: Record<string, any>) {
    if (!this.hasConfig()) {
      logger.warn('OneSignal not configured; skipping push send');
      return;
    }

    if (!deviceIds || deviceIds.length === 0) return;

    const payload: any = {
      app_id: this.appId,
      include_player_ids: deviceIds,
      headings: { en: heading },
      contents: { en: message },
    };

    if (data) payload.data = data;

    try {
      logger.log(`Sending OneSignal push to ${deviceIds.length} device(s): ${heading} - ${message}`);
      const resp = await axios.post(this.apiUrl, payload, {
        headers: {
          Authorization: `Basic ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      logger.log(`OneSignal send success: ${resp.status} (${resp.data?.id ?? 'no-id'})`);
      logger.debug(`OneSignal response ${resp.status}`);
      return resp.data;
    } catch (err) {
      logger.error('Failed to send push via OneSignal', err?.response?.data || err.message || err);
    }
  }
}
