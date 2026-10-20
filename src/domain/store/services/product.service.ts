import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductRepository } from '../repositories/product.repo';
import { ProductCategoryRepository } from '../repositories/product-category.repo';
import { Product, MoneyAmount } from '../models/product.model';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductType } from '../enums/product-type.enum';
import {
  CreateProductDto,
  UpdateProductDto,
  ReviewProductDto,
  ProductResponseDto,
  ProductListItemDto,
} from '../dtos/product.dto';
import { ProductQueryDto } from '../dtos/product-query.dto';
import { CurrencyService } from 'src/shared/currency/currency.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepo: ProductRepository,
    private readonly categoryRepo: ProductCategoryRepository,
    private readonly currencyService: CurrencyService,
  ) {}

  async create(adminId: string, dto: CreateProductDto): Promise<ProductResponseDto> {
    await this.validateCategory(dto.category);
    await this.validateSku(dto.sku);

    if (dto.type === ProductType.PURCHASE && (!dto.prices || dto.prices.length === 0)) {
      throw new BadRequestException('Purchase products must have at least one price');
    }

    if (dto.type === ProductType.RENTAL && !dto.rentalConfig) {
      throw new BadRequestException('Rental products must have rentalConfig');
    }

    const normalizedPrices = dto.prices ? this.normalizeMoneyAmounts(dto.prices) : [];
    const normalizedRentalConfig = dto.rentalConfig
      ? {
          ...dto.rentalConfig,
          pricePerUnit: this.normalizeMoneyAmounts(dto.rentalConfig.pricePerUnit),
        }
      : undefined;

    const product = await this.productRepo.create({
      name: dto.name,
      description: dto.description,
      sku: dto.sku.toUpperCase().trim(),
      category: new Types.ObjectId(dto.category),
      images: dto.images || [],
      type: dto.type,
      prices: normalizedPrices,
      stockQuantity: dto.stockQuantity,
      availableForPurchase: dto.type === ProductType.PURCHASE ? dto.stockQuantity : 0,
      rentalConfig: normalizedRentalConfig
        ? {
            ...normalizedRentalConfig,
            quantity: normalizedRentalConfig.quantity,
          }
        : null,
      status: ProductStatus.DRAFT,
      createdBy: new Types.ObjectId(adminId),
    });

    return this.mapToDto(product);
  }

  async update(adminId: string, productId: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.productRepo.findByIdRaw(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status === ProductStatus.APPROVED) {
      throw new BadRequestException('Approved products cannot be edited; archive and create a new one');
    }

    if (dto.category) {
      await this.validateCategory(dto.category);
    }

    const update: any = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.category !== undefined) update.category = new Types.ObjectId(dto.category);
    if (dto.images !== undefined) update.images = dto.images;
    if (dto.type !== undefined) update.type = dto.type;
    if (dto.stockQuantity !== undefined) update.stockQuantity = dto.stockQuantity;

    if (dto.prices !== undefined) {
      update.prices = this.normalizeMoneyAmounts(dto.prices);
    }

    if (dto.rentalConfig !== undefined) {
      update.rentalConfig = {
        ...dto.rentalConfig,
        pricePerUnit: this.normalizeMoneyAmounts(dto.rentalConfig.pricePerUnit),
      };
    }

    if (dto.type === ProductType.PURCHASE) {
      update.availableForPurchase = dto.stockQuantity ?? product.stockQuantity;
      if (!update.rentalConfig) update.rentalConfig = null;
    } else if (dto.type === ProductType.RENTAL) {
      update.availableForPurchase = 0;
      if (!update.prices) update.prices = [];
    }

    const updated = await this.productRepo.update(productId, update);
    return this.mapToDto(updated!);
  }

  async submitForApproval(productId: string): Promise<ProductResponseDto> {
    const product = await this.productRepo.findByIdRaw(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== ProductStatus.DRAFT && product.status !== ProductStatus.REJECTED) {
      throw new BadRequestException('Only draft or rejected products can be submitted for approval');
    }

    const updated = await this.productRepo.update(productId, {
      status: ProductStatus.PENDING_APPROVAL,
      rejectionReason: null,
    });

    return this.mapToDto(updated!);
  }

  async reviewProduct(
    adminId: string,
    productId: string,
    dto: ReviewProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findByIdRaw(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.status !== ProductStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending products can be reviewed');
    }

    if (dto.status === ProductStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const update: any = {
      status: dto.status,
      rejectionReason: dto.status === ProductStatus.REJECTED ? dto.rejectionReason : null,
    };

    if (dto.status === ProductStatus.APPROVED) {
      update.approvedBy = new Types.ObjectId(adminId);
      update.approvedAt = new Date();
    }

    const updated = await this.productRepo.update(productId, update);
    return this.mapToDto(updated!);
  }

  async findApprovedProducts(
    query: ProductQueryDto,
    currency: string,
  ): Promise<{ items: ProductListItemDto[]; total: number; page: number; size: number }> {
    const filter: ProductQueryDto = { ...query, page: query.page, size: query.size };

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      // Price filtering requires post-processing because prices are stored per currency.
      // We fetch approved products and filter by selected currency price range.
      const { items: allItems, total: rawTotal } = await this.productRepo.findWithFilters({
        ...filter,
        status: ProductStatus.APPROVED,
      });

      const currencyFiltered = allItems.filter((product) => {
        const selected = this.selectPrice(product, currency);
        if (query.minPrice !== undefined && selected.amount < query.minPrice) return false;
        if (query.maxPrice !== undefined && selected.amount > query.maxPrice) return false;
        return true;
      });

      return {
        items: currencyFiltered.map((p) => this.mapToDto(p, currency)),
        total: currencyFiltered.length,
        page: query.page || 1,
        size: query.size || 20,
      };
    }

    const { items, total } = await this.productRepo.findWithFilters({
      ...filter,
      status: ProductStatus.APPROVED,
    });

    return {
      items: items.map((p) => this.mapToDto(p, currency)),
      total,
      page: query.page || 1,
      size: query.size || 20,
    };
  }

  async findApprovedById(productId: string, currency: string): Promise<ProductListItemDto> {
    const product = await this.productRepo.findById(productId);
    if (!product || product.status !== ProductStatus.APPROVED) {
      throw new NotFoundException('Product not found');
    }

    return this.mapToDto(product, currency);
  }

  async findByIdAdmin(productId: string): Promise<ProductResponseDto> {
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.mapToDto(product);
  }

  async findAllAdmin(query: ProductQueryDto): Promise<{ items: ProductResponseDto[]; total: number; page: number; size: number }> {
    const { items, total } = await this.productRepo.findWithFilters(query);
    return {
      items: items.map((p) => this.mapToDto(p)),
      total,
      page: query.page || 1,
      size: query.size || 20,
    };
  }

  async archiveProduct(productId: string): Promise<ProductResponseDto> {
    const product = await this.productRepo.findByIdRaw(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const updated = await this.productRepo.update(productId, { status: ProductStatus.ARCHIVED });
    return this.mapToDto(updated!);
  }

  selectPrice(product: Product, currency: string): MoneyAmount {
    const prices =
      product.type === ProductType.PURCHASE
        ? product.prices || []
        : product.rentalConfig?.pricePerUnit || [];

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

  private normalizeMoneyAmounts(amounts: MoneyAmount[]): MoneyAmount[] {
    return amounts.map((a) => ({
      currencyCode: a.currencyCode.toUpperCase().trim(),
      amount: Number(a.amount),
    }));
  }

  private async validateCategory(categoryId: string): Promise<void> {
    const category = await this.categoryRepo.findById(categoryId);
    if (!category) {
      throw new NotFoundException('Product category not found');
    }
  }

  private async validateSku(sku: string): Promise<void> {
    const existing = await this.productRepo.findBySku(sku);
    if (existing) {
      throw new BadRequestException('Product SKU already exists');
    }
  }

  private mapToDto(product: Product, currency?: string): ProductResponseDto {
    const category = (product.category as any)?._id
      ? {
          _id: (product.category as any)._id.toString(),
          name: (product.category as any).name,
          slug: (product.category as any).slug,
        }
      : product.category?.toString();

    const dto: ProductResponseDto = {
      _id: (product._id as any).toString(),
      name: product.name,
      description: product.description,
      sku: product.sku,
      category,
      images: product.images || [],
      type: product.type,
      prices: product.prices || [],
      stockQuantity: product.stockQuantity,
      availableForPurchase: product.availableForPurchase,
      rentalConfig: product.rentalConfig
        ? {
            granularity: product.rentalConfig.granularity,
            pricePerUnit: product.rentalConfig.pricePerUnit,
            minimumDuration: product.rentalConfig.minimumDuration,
            quantity: product.rentalConfig.quantity,
          }
        : undefined,
      status: product.status as ProductStatus,
      rejectionReason: product.rejectionReason ?? null,
      createdBy: product.createdBy.toString(),
      approvedBy: product.approvedBy?.toString() ?? null,
      approvedAt: product.approvedAt ? new Date(product.approvedAt).toISOString() : null,
      createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : undefined,
      updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : undefined,
    };

    if (currency) {
      const selected = this.selectPrice(product, currency);
      if (product.type === ProductType.PURCHASE) {
        dto.prices = [selected];
      } else if (product.rentalConfig) {
        dto.rentalConfig = {
          ...dto.rentalConfig!,
          pricePerUnit: [selected],
        };
      }
      dto.currency = selected.currencyCode;
    }

    return dto;
  }
}
