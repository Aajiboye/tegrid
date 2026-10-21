import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { CartRepository } from '../repositories/cart.repo';
import { CartItemRepository } from '../repositories/cart-item.repo';
import { OrderRepository } from '../repositories/order.repo';
import { OrderItemRepository } from '../repositories/order-item.repo';
import { StorePaymentRepository } from '../repositories/store-payment.repo';
import { RentalReservationRepository } from '../repositories/rental-reservation.repo';
import { ProductRepository } from '../repositories/product.repo';
import { ShippingAddressRepository } from '../repositories/shipping-address.repo';
import { CartService } from './cart.service';
import { RentalService } from './rental.service';
import { ProductService } from './product.service';
import { OrderStatus } from '../enums/order-status.enum';
import { ProductType } from '../enums/product-type.enum';
import { RentalStatus } from '../enums/rental-status.enum';
import { CartStatus } from '../enums/cart-status.enum';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import { CheckoutDto, CheckoutResponseDto } from '../dtos/checkout.dto';
import { PaystackWalletProvider } from 'src/domain/wallet/providers/paystack';

@Injectable()
export class CheckoutService {
  constructor(
    private readonly configService: ConfigService,
    private readonly cartRepo: CartRepository,
    private readonly cartItemRepo: CartItemRepository,
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
    private readonly storePaymentRepo: StorePaymentRepository,
    private readonly rentalReservationRepo: RentalReservationRepository,
    private readonly productRepo: ProductRepository,
    private readonly shippingAddressRepo: ShippingAddressRepository,
    private readonly cartService: CartService,
    private readonly rentalService: RentalService,
    private readonly productService: ProductService,
    private readonly paystackProvider: PaystackWalletProvider,
  ) {}

  async checkout(
    userId: string,
    userType: UserType,
    userEmail: string,
    dto: CheckoutDto,
  ): Promise<CheckoutResponseDto> {
    const cart = await this.cartRepo.findActiveByUser(userId, userType);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    if (cart.expiresAt < new Date()) {
      await this.cartService.clearCart(cart._id!.toString());
      throw new BadRequestException('Cart has expired. Please add items again.');
    }

    const cartItems = await this.cartItemRepo.findByCartRaw(cart._id!.toString());
    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const shippingAddress = await this.shippingAddressRepo.findById(dto.shippingAddressId);
    if (!shippingAddress || shippingAddress.user.toString() !== userId || shippingAddress.userType !== userType) {
      throw new NotFoundException('Shipping address not found');
    }

    // Validate rental availability again before checkout
    for (const item of cartItems) {
      if (item.type === ProductType.RENTAL) {
        const availability = await this.rentalService.checkAvailability(
          (item.product as any).toString(),
          item.quantity,
          item.rentalStart!,
          item.rentalEnd!,
          item.currency,
        );
        if (!availability.available) {
          throw new BadRequestException(availability.message || 'Rental item no longer available');
        }
      }
    }

    const deliveryFee = await this.getDeliveryFee();
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity * (item.rentalDuration || 1),
      0,
    );
    const totalAmount = subtotal + deliveryFee;

    const orderNumber = await this.generateOrderNumber();

    const order = await this.orderRepo.create({
      orderNumber,
      user: new Types.ObjectId(userId),
      userType,
      status: OrderStatus.PENDING_PAYMENT,
      currency: cart.currency,
      subtotal,
      deliveryFee,
      totalAmount,
      shippingAddress: {
        label: shippingAddress.label,
        recipientName: shippingAddress.recipientName,
        phoneNumber: shippingAddress.phoneNumber,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country,
        postalCode: shippingAddress.postalCode,
      },
    });

    const orderItems = await Promise.all(
      cartItems.map(async (item) => {
        const total = item.unitPrice * item.quantity * (item.rentalDuration || 1);
        return this.orderItemRepo.create({
          order: order._id,
          product: item.product,
          type: item.type,
          quantity: item.quantity,
          rentalStart: item.rentalStart,
          rentalEnd: item.rentalEnd,
          rentalDuration: item.rentalDuration,
          unitPrice: item.unitPrice,
          total,
          currency: item.currency,
        });
      }),
    );

    const reference = `STR-${uuidv4()}`;
    const amountInMinorUnits = totalAmount;
    const apiUrl = this.configService.get<string>('api.apiUrl') || 'http://localhost:8080';
    const callbackUrl = `${apiUrl}/v1/store/payments/paystack/callback`;

    let initialized;
    try {
      initialized = await this.paystackProvider.initializeTransaction(
        userEmail,
        amountInMinorUnits,
        reference,
        callbackUrl,
        { orderId: order._id!.toString(), userId, userType },
      );
    } catch (error) {
      // Rollback order creation on payment init failure
      await this.orderItemRepo.deleteByOrder(order._id!.toString());
      await this.orderRepo.update(order._id!.toString(), { status: OrderStatus.CANCELLED });
      throw new BadRequestException('Failed to initialize payment');
    }

    const payment = await this.storePaymentRepo.create({
      order: order._id,
      user: new Types.ObjectId(userId),
      userType,
      amount: totalAmount,
      currency: cart.currency,
      status: 'PENDING',
      paystackReference: reference,
    });

    await this.orderRepo.update(order._id!.toString(), { payment: payment._id });

    // Create rental reservations as RESERVED
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i];
      if (item.type === ProductType.RENTAL) {
        await this.rentalService.createReservation({
          orderItemId: orderItems[i]._id!.toString(),
          orderId: order._id!.toString(),
          productId: (item.product as any).toString(),
          quantity: item.quantity,
          rentalStart: item.rentalStart!,
          rentalEnd: item.rentalEnd!,
          status: RentalStatus.RESERVED,
        });
      }
    }

    await this.cartRepo.markStatus(cart._id!.toString(), CartStatus.CONVERTED);

    return {
      orderId: order._id!.toString(),
      orderNumber,
      authorizationUrl: initialized.authorization_url,
      accessCode: initialized.access_code,
      reference: initialized.reference,
      amount: amountInMinorUnits,
      currency: cart.currency,
    };
  }

  async handlePaystackCallback(reference: string): Promise<any> {
    const payment = await this.storePaymentRepo.findByReference(reference);
    if (!payment) {
      throw new NotFoundException('Payment record not found');
    }

    if (payment.status === 'SUCCESS') {
      const order = await this.orderRepo.findById(payment.order.toString());
      return { order, payment };
    }

    const verification = await this.paystackProvider.verifyTransaction(reference);
    if (verification.status && verification.data?.status === 'success') {
      const orderId = payment.order.toString();
      const updatedPayment = await this.storePaymentRepo.updateByReference(reference, 'SUCCESS', {
        verifiedAt: new Date(),
        providerAmount: verification.data.amount,
        providerCurrency: verification.data.currency,
      });

      const updatedOrder = await this.orderRepo.update(orderId, {
        status: OrderStatus.PAID,
        paidAt: new Date(),
      });

      // Confirm rental reservations to ACTIVE
      await this.rentalReservationRepo.confirmReservationsByOrder(orderId, RentalStatus.ACTIVE);

      return { order: updatedOrder, payment: updatedPayment };
    }

    await this.storePaymentRepo.updateByReference(reference, 'FAILED');
    throw new BadRequestException('Payment verification failed');
  }

  async handlePaystackWebhook(event: string, data: any): Promise<void> {
    if (event !== 'charge.success') {
      return;
    }
    const reference = data?.reference;
    if (!reference) return;

    try {
      await this.handlePaystackCallback(reference);
    } catch (error) {
      // log error
    }
  }

  async getDeliveryFee(): Promise<number> {
    // Flat delivery fee in minor units (e.g., kobo); can be made configurable via config/env
    return this.configService.get<number>('store.deliveryFee') || 250000;
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const prefix = `STR-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-`;

    let attempt = 0;
    while (attempt < 10) {
      const suffix = String(Math.floor(1000 + Math.random() * 9000));
      const orderNumber = `${prefix}${suffix}`;
      const existing = await this.orderRepo.findByOrderNumber(orderNumber);
      if (!existing) {
        return orderNumber;
      }
      attempt++;
    }

    // Fallback with timestamp
    return `${prefix}${Date.now().toString().slice(-4)}`;
  }
}
