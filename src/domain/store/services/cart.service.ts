import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CartRepository } from '../repositories/cart.repo';
import { CartItemRepository } from '../repositories/cart-item.repo';
import { ProductRepository } from '../repositories/product.repo';
import { ProductService } from './product.service';
import { RentalService } from './rental.service';
import { Cart, CartStatus } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { Product } from '../models/product.model';
import { ProductType } from '../enums/product-type.enum';
import { UserType } from 'src/domain/identity/enums/user-types.enum';
import { AddCartItemDto, UpdateCartItemDto, CartResponseDto, CartItemResponseDto } from '../dtos/cart.dto';

const CART_RESERVATION_MINUTES = 30;

@Injectable()
export class CartService {
  constructor(
    private readonly cartRepo: CartRepository,
    private readonly cartItemRepo: CartItemRepository,
    private readonly productRepo: ProductRepository,
    private readonly productService: ProductService,
    private readonly rentalService: RentalService,
  ) {}

  async addItem(
    userId: string,
    userType: UserType,
    dto: AddCartItemDto,
    currency: string,
  ): Promise<CartResponseDto> {
    const product = await this.productRepo.findByIdRaw(dto.productId);
    if (!product || product.status !== 'APPROVED') {
      throw new NotFoundException('Product not found or not available');
    }

    if (product.type !== dto.type) {
      throw new BadRequestException(`Product is only available for ${product.type.toLowerCase()}`);
    }

    const cart = await this.getOrCreateCart(userId, userType, currency);

    // Currency consistency
    if (cart.currency.toUpperCase() !== currency.toUpperCase()) {
      throw new BadRequestException(
        `Cart currency is ${cart.currency}. Please clear cart or use matching currency.`,
      );
    }

    if (dto.type === ProductType.PURCHASE) {
      await this.addPurchaseItem(cart, product, dto.quantity, currency);
    } else {
      if (!dto.rentalStart || !dto.rentalEnd) {
        throw new BadRequestException('Rental start and end dates are required');
      }
      await this.addRentalItem(
        cart,
        product,
        dto.quantity,
        new Date(dto.rentalStart),
        new Date(dto.rentalEnd),
        currency,
      );
    }

    return this.getCartResponse(cart._id!.toString());
  }

  private async addPurchaseItem(cart: Cart, product: Product, quantity: number, currency: string): Promise<void> {
    const reserved = await this.productRepo.atomicReservePurchase(product._id!.toString(), quantity);
    if (!reserved) {
      throw new BadRequestException('Insufficient stock for purchase');
    }

    const price = this.productService.selectPrice(product, currency);

    await this.cartItemRepo.create({
      cart: cart._id,
      product: product._id,
      type: ProductType.PURCHASE,
      quantity,
      unitPrice: price.amount,
      currency: price.currencyCode,
      rentalStart: null,
      rentalEnd: null,
      rentalDuration: null,
      reservedAt: new Date(),
    });

    await this.extendCartExpiry(cart._id!.toString());
  }

  private async addRentalItem(
    cart: Cart,
    product: Product,
    quantity: number,
    rentalStart: Date,
    rentalEnd: Date,
    currency: string,
  ): Promise<void> {
    const availability = await this.rentalService.checkAvailability(
      product._id!.toString(),
      quantity,
      rentalStart,
      rentalEnd,
      currency,
    );

    if (!availability.available) {
      throw new BadRequestException(availability.message || 'Rental not available');
    }

    const reserved = await this.productRepo.atomicReserveRental(product._id!.toString(), quantity);
    if (!reserved) {
      throw new BadRequestException('Insufficient rental stock');
    }

    const duration = availability.duration;

    await this.cartItemRepo.create({
      cart: cart._id,
      product: product._id,
      type: ProductType.RENTAL,
      quantity,
      rentalStart,
      rentalEnd,
      rentalDuration: duration,
      unitPrice: availability.unitPrice,
      currency: availability.currency,
      reservedAt: new Date(),
    });

    await this.extendCartExpiry(cart._id!.toString());
  }

  async updateItem(
    userId: string,
    userType: UserType,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartRepo.findActiveByUser(userId, userType);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.cartItemRepo.findById(itemId);
    if (!item || (item.cart as any).toString() !== cart._id!.toString()) {
      throw new NotFoundException('Cart item not found');
    }

    const product = await this.productRepo.findByIdRaw((item.product as any).toString());
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const oldQuantity = item.quantity;
    const newQuantity = dto.quantity;
    const quantityDelta = newQuantity - oldQuantity;

    if (item.type === ProductType.PURCHASE) {
      if (quantityDelta > 0) {
        const reserved = await this.productRepo.atomicReservePurchase(
          product._id!.toString(),
          quantityDelta,
        );
        if (!reserved) {
          throw new BadRequestException('Insufficient stock for purchase');
        }
      } else if (quantityDelta < 0) {
        await this.productRepo.atomicReleasePurchase(product._id!.toString(), Math.abs(quantityDelta));
      }

      await this.cartItemRepo.update(itemId, {
        quantity: newQuantity,
      });
    } else {
      // Rental: release old, reserve new dates/qty
      await this.productRepo.atomicReleaseRental(product._id!.toString(), oldQuantity);

      const rentalStart = dto.rentalStart ? new Date(dto.rentalStart) : item.rentalStart!;
      const rentalEnd = dto.rentalEnd ? new Date(dto.rentalEnd) : item.rentalEnd!;

      const availability = await this.rentalService.checkAvailability(
        product._id!.toString(),
        newQuantity,
        rentalStart,
        rentalEnd,
        item.currency,
      );

      if (!availability.available) {
        // restore old reservation
        await this.productRepo.atomicReserveRental(product._id!.toString(), oldQuantity);
        throw new BadRequestException(availability.message || 'Rental not available');
      }

      const reserved = await this.productRepo.atomicReserveRental(product._id!.toString(), newQuantity);
      if (!reserved) {
        await this.productRepo.atomicReserveRental(product._id!.toString(), oldQuantity);
        throw new BadRequestException('Insufficient rental stock');
      }

      await this.cartItemRepo.update(itemId, {
        quantity: newQuantity,
        rentalStart,
        rentalEnd,
        rentalDuration: availability.duration,
        unitPrice: availability.unitPrice,
      });
    }

    await this.extendCartExpiry(cart._id!.toString());
    return this.getCartResponse(cart._id!.toString());
  }

  async removeItem(userId: string, userType: UserType, itemId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepo.findActiveByUser(userId, userType);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const item = await this.cartItemRepo.findById(itemId);
    if (!item || (item.cart as any).toString() !== cart._id!.toString()) {
      throw new NotFoundException('Cart item not found');
    }

    await this.releaseCartItemStock(item);
    await this.cartItemRepo.deleteById(itemId);

    const remainingItems = await this.cartItemRepo.findByCart(cart._id!.toString());
    if (remainingItems.length === 0) {
      await this.cartRepo.markStatus(cart._id!.toString(), CartStatus.ABANDONED);
    } else {
      await this.extendCartExpiry(cart._id!.toString());
    }

    return this.getCartResponse(cart._id!.toString());
  }

  async getCart(userId: string, userType: UserType): Promise<CartResponseDto | null> {
    const cart = await this.cartRepo.findActiveByUser(userId, userType);
    if (!cart) {
      return null;
    }
    return this.getCartResponse(cart._id!.toString());
  }

  async clearCart(cartId: string): Promise<void> {
    const items = await this.cartItemRepo.findByCartRaw(cartId);
    for (const item of items) {
      await this.releaseCartItemStock(item);
    }
    await this.cartItemRepo.deleteByCart(cartId);
    await this.cartRepo.markStatus(cartId, CartStatus.ABANDONED);
  }

  async releaseCartItemStock(item: CartItem): Promise<void> {
    const productId = (item.product as any).toString();
    if (item.type === ProductType.PURCHASE) {
      await this.productRepo.atomicReleasePurchase(productId, item.quantity);
    } else {
      await this.productRepo.atomicReleaseRental(productId, item.quantity);
    }
  }

  async releaseExpiredCarts(): Promise<void> {
    const expiredCarts = await this.cartRepo.findExpiredActive();
    for (const cart of expiredCarts) {
      await this.clearCart(cart._id!.toString());
    }
  }

  private async getOrCreateCart(userId: string, userType: UserType, currency: string): Promise<Cart> {
    let cart = await this.cartRepo.findActiveByUser(userId, userType);
    if (!cart) {
      cart = await this.cartRepo.create({
        user: new Types.ObjectId(userId),
        userType,
        currency: currency.toUpperCase(),
        status: CartStatus.ACTIVE,
        expiresAt: this.getExpiryDate(),
      });
    }
    return cart;
  }

  private async extendCartExpiry(cartId: string): Promise<void> {
    await this.cartRepo.update(cartId, { expiresAt: this.getExpiryDate() });
  }

  private getExpiryDate(): Date {
    const date = new Date();
    date.setMinutes(date.getMinutes() + CART_RESERVATION_MINUTES);
    return date;
  }

  private async getCartResponse(cartId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepo.findById(cartId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const items = await this.cartItemRepo.findByCart(cartId);
    const itemDtos: CartItemResponseDto[] = items.map((item) => {
      const product = item.product as any;
      const total = item.unitPrice * item.quantity * (item.rentalDuration || 1);
      return {
        _id: (item._id as any).toString(),
        productId: product._id.toString(),
        productName: product.name,
        type: item.type,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total,
        currency: item.currency,
        rentalStart: item.rentalStart ? new Date(item.rentalStart).toISOString() : undefined,
        rentalEnd: item.rentalEnd ? new Date(item.rentalEnd).toISOString() : undefined,
        rentalDuration: item.rentalDuration ?? undefined,
        image: product.images?.[0],
      };
    });

    const subtotal = itemDtos.reduce((sum, item) => sum + item.total, 0);

    return {
      _id: cart._id!.toString(),
      currency: cart.currency,
      status: cart.status as string,
      expiresAt: cart.expiresAt.toISOString(),
      items: itemDtos,
      subtotal,
      itemCount: itemDtos.length,
    };
  }
}
