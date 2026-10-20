import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CartService } from './cart.service';

@Injectable()
export class CartCleanupService {
  private readonly logger = new Logger(CartCleanupService.name);

  constructor(private readonly cartService: CartService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredCarts(): Promise<void> {
    this.logger.log('Cleaning up expired carts');
    try {
      await this.cartService.releaseExpiredCarts();
      this.logger.log('Expired carts cleanup completed');
    } catch (error) {
      this.logger.error('Failed to clean up expired carts', error.message);
    }
  }
}
