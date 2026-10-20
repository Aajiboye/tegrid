import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { WalletModule } from 'src/domain/wallet/wallet.module';
import { ProductCategory, ProductCategorySchema } from './models/product-category.model';
import { Product, ProductSchema } from './models/product.model';
import { ShippingAddress, ShippingAddressSchema } from './models/shipping-address.model';
import { Cart, CartSchema } from './models/cart.model';
import { CartItem, CartItemSchema } from './models/cart-item.model';
import { Order, OrderSchema } from './models/order.model';
import { OrderItem, OrderItemSchema } from './models/order-item.model';
import { StorePayment, StorePaymentSchema } from './models/store-payment.model';
import { RentalReservation, RentalReservationSchema } from './models/rental-reservation.model';
import { DeliveryTracking, DeliveryTrackingSchema } from './models/delivery-tracking.model';
import { ProductCategoryRepository } from './repositories/product-category.repo';
import { ProductRepository } from './repositories/product.repo';
import { ShippingAddressRepository } from './repositories/shipping-address.repo';
import { CartRepository } from './repositories/cart.repo';
import { CartItemRepository } from './repositories/cart-item.repo';
import { OrderRepository } from './repositories/order.repo';
import { OrderItemRepository } from './repositories/order-item.repo';
import { StorePaymentRepository } from './repositories/store-payment.repo';
import { RentalReservationRepository } from './repositories/rental-reservation.repo';
import { DeliveryTrackingRepository } from './repositories/delivery-tracking.repo';
import { ProductCategoryService } from './services/product-category.service';
import { ProductService } from './services/product.service';
import { ShippingAddressService } from './services/shipping-address.service';
import { RentalService } from './services/rental.service';
import { CartService } from './services/cart.service';
import { CheckoutService } from './services/checkout.service';
import { OrderService } from './services/order.service';
import { CartCleanupService } from './services/cart-cleanup.service';
import { CurrencyService } from 'src/shared/currency/currency.service';
import { AdminCategoryController } from './controllers/admin-category.controller';
import { StoreCategoryController } from './controllers/store-category.controller';
import { AdminProductController } from './controllers/admin-product.controller';
import { StoreProductController } from './controllers/store-product.controller';
import { ShippingAddressController } from './controllers/shipping-address.controller';
import { CartController } from './controllers/cart.controller';
import { CheckoutController } from './controllers/checkout.controller';
import { StorePaymentController } from './controllers/store-payment.controller';
import { OrderController } from './controllers/order.controller';
import { AdminOrderController } from './controllers/admin-order.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductCategory.name, schema: ProductCategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: ShippingAddress.name, schema: ShippingAddressSchema },
      { name: Cart.name, schema: CartSchema },
      { name: CartItem.name, schema: CartItemSchema },
      { name: Order.name, schema: OrderSchema },
      { name: OrderItem.name, schema: OrderItemSchema },
      { name: StorePayment.name, schema: StorePaymentSchema },
      { name: RentalReservation.name, schema: RentalReservationSchema },
      { name: DeliveryTracking.name, schema: DeliveryTrackingSchema },
    ]),
    WalletModule,
  ],
  providers: [
    ConfigService,
    CurrencyService,
    ProductCategoryRepository,
    ProductRepository,
    ShippingAddressRepository,
    CartRepository,
    CartItemRepository,
    OrderRepository,
    OrderItemRepository,
    StorePaymentRepository,
    RentalReservationRepository,
    DeliveryTrackingRepository,
    ProductCategoryService,
    ProductService,
    ShippingAddressService,
    RentalService,
    CartService,
    CheckoutService,
    OrderService,
    CartCleanupService,
  ],
  controllers: [
    AdminCategoryController,
    StoreCategoryController,
    AdminProductController,
    StoreProductController,
    ShippingAddressController,
    CartController,
    CheckoutController,
    StorePaymentController,
    OrderController,
    AdminOrderController,
  ],
  exports: [
    ProductService,
    ProductRepository,
    CartRepository,
    CartItemRepository,
    OrderRepository,
    OrderItemRepository,
    StorePaymentRepository,
    RentalReservationRepository,
    DeliveryTrackingRepository,
    ShippingAddressRepository,
  ],
})
export class StoreModule {}
