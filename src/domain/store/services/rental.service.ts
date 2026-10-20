import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { RentalReservationRepository } from '../repositories/rental-reservation.repo';
import { ProductRepository } from '../repositories/product.repo';
import { Product } from '../models/product.model';
import { ProductType } from '../enums/product-type.enum';
import { RentalGranularity } from '../enums/rental-granularity.enum';
import { RentalStatus } from '../enums/rental-status.enum';

export interface RentalAvailabilityResult {
  available: boolean;
  maxAvailable: number;
  requestedQuantity: number;
  unitPrice: number;
  duration: number;
  currency: string;
  message?: string;
}

@Injectable()
export class RentalService {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly reservationRepo: RentalReservationRepository,
  ) {}

  async checkAvailability(
    productId: string,
    quantity: number,
    rentalStart: Date,
    rentalEnd: Date,
    currency: string,
  ): Promise<RentalAvailabilityResult> {
    const product = await this.productRepo.findByIdRaw(productId);
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    if (product.type !== ProductType.RENTAL) {
      throw new BadRequestException('Product is not available for rent');
    }

    if (!product.rentalConfig) {
      throw new BadRequestException('Rental configuration missing');
    }

    if (rentalStart >= rentalEnd) {
      throw new BadRequestException('Rental end must be after rental start');
    }

    const duration = this.computeDuration(rentalStart, rentalEnd, product.rentalConfig.granularity);
    if (product.rentalConfig.minimumDuration && duration < product.rentalConfig.minimumDuration) {
      throw new BadRequestException(
        `Minimum rental duration is ${product.rentalConfig.minimumDuration} ${product.rentalConfig.granularity.toLowerCase()}(s)`,
      );
    }

    const totalRentalUnits = product.rentalConfig.quantity;
    const overlappingReservations = await this.reservationRepo.findActiveByProduct(
      productId,
      rentalStart,
      rentalEnd,
    );

    const maxConcurrentRented = this.computeMaxConcurrentRentals(
      overlappingReservations,
      rentalStart,
      rentalEnd,
    );

    const available = totalRentalUnits - maxConcurrentRented;
    const unitPrice = this.selectRentalPrice(product, currency);

    return {
      available: available >= quantity,
      maxAvailable: Math.max(0, available),
      requestedQuantity: quantity,
      unitPrice,
      duration,
      currency: unitPrice.currencyCode,
      message: available >= quantity ? undefined : `Only ${available} unit(s) available for the selected dates`,
    };
  }

  computeDuration(start: Date, end: Date, granularity: RentalGranularity): number {
    const ms = end.getTime() - start.getTime();
    if (granularity === RentalGranularity.HOURLY) {
      return Math.ceil(ms / (1000 * 60 * 60));
    }
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  selectRentalPrice(product: Product, currency: string): { currencyCode: string; amount: number } {
    const prices = product.rentalConfig?.pricePerUnit || [];
    const target = currency.toUpperCase();

    const found = prices.find((p) => p.currencyCode.toUpperCase() === target);
    if (found) {
      return { currencyCode: found.currencyCode.toUpperCase(), amount: Number(found.amount) };
    }

    const ngn = prices.find((p) => p.currencyCode.toUpperCase() === 'NGN');
    if (ngn) {
      return { currencyCode: 'NGN', amount: Number(ngn.amount) };
    }

    if (prices.length > 0) {
      return { currencyCode: prices[0].currencyCode.toUpperCase(), amount: Number(prices[0].amount) };
    }

    return { currencyCode: target, amount: 0 };
  }

  private computeMaxConcurrentRentals(
    reservations: { rentalStart: Date; rentalEnd: Date; quantity: number }[],
    windowStart: Date,
    windowEnd: Date,
  ): number {
    // Consider all event points within the requested window
    const points = new Set<number>();
    points.add(windowStart.getTime());
    points.add(windowEnd.getTime());

    for (const r of reservations) {
      const start = Math.max(r.rentalStart.getTime(), windowStart.getTime());
      const end = Math.min(r.rentalEnd.getTime(), windowEnd.getTime());
      if (start < end) {
        points.add(start);
        points.add(end);
      }
    }

    const sorted = Array.from(points).sort((a, b) => a - b);
    let max = 0;

    for (let i = 0; i < sorted.length - 1; i++) {
      const segStart = sorted[i];
      const segEnd = sorted[i + 1];
      const mid = segStart + (segEnd - segStart) / 2;

      const concurrent = reservations.reduce((sum, r) => {
        if (r.rentalStart.getTime() <= mid && r.rentalEnd.getTime() > mid) {
          return sum + r.quantity;
        }
        return sum;
      }, 0);

      max = Math.max(max, concurrent);
    }

    return max;
  }

  async createReservation(payload: {
    orderItemId: string;
    orderId: string;
    productId: string;
    quantity: number;
    rentalStart: Date;
    rentalEnd: Date;
    status?: RentalStatus;
  }): Promise<any> {
    return this.reservationRepo.create({
      orderItem: new Types.ObjectId(payload.orderItemId),
      order: new Types.ObjectId(payload.orderId),
      product: new Types.ObjectId(payload.productId),
      quantity: payload.quantity,
      rentalStart: payload.rentalStart,
      rentalEnd: payload.rentalEnd,
      status: payload.status || RentalStatus.RESERVED,
    });
  }

  async requestReturn(reservationId: string): Promise<any> {
    const reservation = await this.reservationRepo.findById(reservationId);
    if (!reservation) {
      throw new BadRequestException('Rental reservation not found');
    }

    if (reservation.status !== RentalStatus.ACTIVE) {
      throw new BadRequestException('Only active rentals can be returned');
    }

    return this.reservationRepo.updateStatus(reservationId, RentalStatus.RETURN_REQUESTED, {
      returnRequestedAt: new Date(),
    });
  }

  async confirmReturn(reservationId: string, adminId: string): Promise<any> {
    const reservation = await this.reservationRepo.findById(reservationId);
    if (!reservation) {
      throw new BadRequestException('Rental reservation not found');
    }

    if (reservation.status !== RentalStatus.RETURN_REQUESTED) {
      throw new BadRequestException('Return must be requested before confirmation');
    }

    const updated = await this.reservationRepo.updateStatus(reservationId, RentalStatus.RETURNED, {
      returnConfirmedAt: new Date(),
      returnConfirmedBy: new Types.ObjectId(adminId),
    });

    // Restore rental stock
    await this.productRepo.atomicReleaseRental(reservation.product.toString(), reservation.quantity);

    return updated;
  }
}
