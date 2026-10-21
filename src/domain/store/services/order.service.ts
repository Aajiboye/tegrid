import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { OrderRepository, OrderListQuery } from '../repositories/order.repo';
import { OrderItemRepository } from '../repositories/order-item.repo';
import { DeliveryTrackingRepository } from '../repositories/delivery-tracking.repo';
import { RentalReservationRepository } from '../repositories/rental-reservation.repo';
import { ProductRepository } from '../repositories/product.repo';
import { Order } from '../models/order.model';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderItem } from '../models/order-item.model';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import { RentalStatus } from '../enums/rental-status.enum';
import {
  OrderResponseDto,
  OrderItemResponseDto,
  OrderQueryDto,
  AdminOrderQueryDto,
  RentalReservationResponseDto,
} from '../dtos/order.dto';
import { AddTrackingUpdateDto, DeliveryTrackingResponseDto } from '../dtos/delivery-tracking.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
    private readonly deliveryTrackingRepo: DeliveryTrackingRepository,
    private readonly rentalReservationRepo: RentalReservationRepository,
    private readonly productRepo: ProductRepository,
  ) {}

  async findByUser(userId: string, userType: UserType, query: OrderQueryDto): Promise<{ items: OrderResponseDto[]; total: number; page: number; size: number }> {
    const { items, total } = await this.orderRepo.findByUser(userId, userType, query);
    const dtos = await Promise.all(items.map((o) => this.mapOrderToDto(o)));

    return {
      items: dtos,
      total,
      page: query.page || 1,
      size: query.size || 20,
    };
  }

  async findById(userId: string, userType: UserType, orderId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.user.toString() !== userId || order.userType !== userType) {
      throw new NotFoundException('Order not found');
    }

    return this.mapOrderToDto(order);
  }

  async findByIdAdmin(orderId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.mapOrderToDto(order);
  }

  async findAllAdmin(query: AdminOrderQueryDto): Promise<{ items: OrderResponseDto[]; total: number; page: number; size: number }> {
    const listQuery: OrderListQuery = {
      status: query.status,
      userId: query.userId,
      userType: query.userType as UserType,
      page: query.page,
      size: query.size,
    };

    const { items, total } = await this.orderRepo.findWithFilters(listQuery);
    const dtos = await Promise.all(items.map((o) => this.mapOrderToDto(o)));

    return {
      items: dtos,
      total,
      page: query.page || 1,
      size: query.size || 20,
    };
  }

  async addTrackingUpdate(orderId: string, dto: AddTrackingUpdateDto): Promise<DeliveryTrackingResponseDto> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Cannot add tracking for unpaid order');
    }

    const tracking = await this.deliveryTrackingRepo.addUpdate(orderId, dto.status, dto.note);

    if (dto.carrier || dto.trackingNumber) {
      await this.deliveryTrackingRepo.updateCarrierInfo(orderId, dto.carrier, dto.trackingNumber);
    }

    if (dto.status === 'SHIPPED' && order.status === OrderStatus.PAID) {
      await this.orderRepo.updateStatus(orderId, OrderStatus.SHIPPED);
    }

    return this.mapTrackingToDto(tracking!);
  }

  async markDelivered(orderId: string, adminId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.SHIPPED && order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('Order cannot be marked as delivered');
    }

    await this.orderRepo.updateStatus(orderId, OrderStatus.DELIVERED, {
      deliveredAt: new Date(),
      deliveredBy: new Types.ObjectId(adminId),
    });

    await this.deliveryTrackingRepo.markDelivered(orderId, new Types.ObjectId(adminId));

    return this.findByIdAdmin(orderId);
  }

  async getRentalReservations(orderId: string): Promise<RentalReservationResponseDto[]> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const reservations = await this.rentalReservationRepo.findByOrder(orderId);
    return Promise.all(
      reservations.map(async (r) => {
        const product = await this.productRepo.findById((r.product as any).toString());
        return {
          _id: (r._id as any).toString(),
          productId: (r.product as any).toString(),
          productName: product?.name || '',
          quantity: r.quantity,
          rentalStart: new Date(r.rentalStart).toISOString(),
          rentalEnd: new Date(r.rentalEnd).toISOString(),
          status: r.status,
          returnRequestedAt: r.returnRequestedAt
            ? new Date(r.returnRequestedAt).toISOString()
            : undefined,
          returnConfirmedAt: r.returnConfirmedAt
            ? new Date(r.returnConfirmedAt).toISOString()
            : undefined,
        };
      }),
    );
  }

  async requestReturn(userId: string, userType: UserType, orderId: string, reservationId: string): Promise<RentalReservationResponseDto> {
    const order = await this.orderRepo.findById(orderId);
    if (!order || order.user.toString() !== userId || order.userType !== userType) {
      throw new NotFoundException('Order not found');
    }

    const reservation = await this.rentalReservationRepo.findById(reservationId);
    if (!reservation || (reservation.order as any).toString() !== orderId) {
      throw new NotFoundException('Rental reservation not found');
    }

    const updated = await this.rentalReservationRepo.updateStatus(reservationId, RentalStatus.RETURN_REQUESTED, {
      returnRequestedAt: new Date(),
    });

    const product = await this.productRepo.findById((updated!.product as any).toString());
    return {
      _id: (updated!._id as any).toString(),
      productId: (updated!.product as any).toString(),
      productName: product?.name || '',
      quantity: updated!.quantity,
      rentalStart: new Date(updated!.rentalStart).toISOString(),
      rentalEnd: new Date(updated!.rentalEnd).toISOString(),
      status: updated!.status,
      returnRequestedAt: updated!.returnRequestedAt
        ? new Date(updated!.returnRequestedAt).toISOString()
        : undefined,
    };
  }

  async confirmReturn(reservationId: string, adminId: string): Promise<RentalReservationResponseDto> {
    const reservation = await this.rentalReservationRepo.findById(reservationId);
    if (!reservation) {
      throw new NotFoundException('Rental reservation not found');
    }

    if (reservation.status !== RentalStatus.RETURN_REQUESTED) {
      throw new BadRequestException('Return must be requested before confirmation');
    }

    const updated = await this.rentalReservationRepo.updateStatus(reservationId, RentalStatus.RETURNED, {
      returnConfirmedAt: new Date(),
      returnConfirmedBy: new Types.ObjectId(adminId),
    });

    await this.productRepo.atomicReleaseRental((updated!.product as any).toString(), updated!.quantity);

    const product = await this.productRepo.findById((updated!.product as any).toString());
    return {
      _id: (updated!._id as any).toString(),
      productId: (updated!.product as any).toString(),
      productName: product?.name || '',
      quantity: updated!.quantity,
      rentalStart: new Date(updated!.rentalStart).toISOString(),
      rentalEnd: new Date(updated!.rentalEnd).toISOString(),
      status: updated!.status,
      returnConfirmedAt: updated!.returnConfirmedAt
        ? new Date(updated!.returnConfirmedAt).toISOString()
        : undefined,
    };
  }

  private async mapOrderToDto(order: Order): Promise<OrderResponseDto> {
    const items = await this.orderItemRepo.findByOrder(order._id!.toString());

    return {
      _id: (order._id as any).toString(),
      orderNumber: order.orderNumber,
      status: order.status as OrderStatus,
      currency: order.currency,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress as any,
      paidAt: order.paidAt ? new Date(order.paidAt).toISOString() : undefined,
      deliveredAt: order.deliveredAt ? new Date(order.deliveredAt).toISOString() : undefined,
      items: items.map((item) => this.mapOrderItemToDto(item)),
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : undefined,
      updatedAt: order.updatedAt ? new Date(order.updatedAt).toISOString() : undefined,
    };
  }

  private mapOrderItemToDto(item: OrderItem): OrderItemResponseDto {
    const product = item.product as any;
    return {
      _id: (item._id as any).toString(),
      productId: product._id.toString(),
      productName: product.name,
      type: item.type,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      currency: item.currency,
      rentalStart: item.rentalStart ? new Date(item.rentalStart).toISOString() : undefined,
      rentalEnd: item.rentalEnd ? new Date(item.rentalEnd).toISOString() : undefined,
      rentalDuration: item.rentalDuration ?? undefined,
      image: product.images?.[0],
    };
  }

  private mapTrackingToDto(tracking: any): DeliveryTrackingResponseDto {
    return {
      orderId: tracking.order.toString(),
      status: tracking.status,
      carrier: tracking.carrier,
      trackingNumber: tracking.trackingNumber,
      updates: (tracking.updates || []).map((u: any) => ({
        status: u.status,
        note: u.note,
        at: new Date(u.at).toISOString(),
      })),
      deliveredAt: tracking.deliveredAt ? new Date(tracking.deliveredAt).toISOString() : undefined,
    };
  }
}
