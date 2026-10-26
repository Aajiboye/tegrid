import { Module, Global, Logger } from '@nestjs/common';
import { PushService } from '../services/push.service';
import { OneSignalPushProvider } from './onesignal.provider';
import { NoopPushProvider } from './noop.provider';
import { IPushProvider, PUSH_PROVIDER } from './push-provider.interface';

@Global()
@Module({
  providers: [
    PushService,
    {
      provide: PUSH_PROVIDER,
      useFactory: (): IPushProvider => {
        const provider = process.env.PUSH_PROVIDER || 'onesignal';
        switch (provider.toLowerCase()) {
          case 'onesignal':
            return new OneSignalPushProvider();
          case 'noop':
            return new NoopPushProvider();
          default:
            Logger.warn(`Unknown PUSH_PROVIDER "${provider}"; falling back to noop`, 'PushModule');
            return new NoopPushProvider();
        }
      },
    },
  ],
  exports: [PushService, PUSH_PROVIDER],
})
export class PushModule {}
