import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ProductCategoryRepository } from '../repositories/product-category.repo';
import { ProductCategory } from '../models/product-category.model';
import { CreateProductCategoryDto, UpdateProductCategoryDto, ProductCategoryResponseDto } from '../dtos/product-category.dto';

const DEFAULT_CATEGORIES = [
  { name: 'Power Tools', slug: 'power-tools', description: 'Electric and battery-powered tools' },
  { name: 'Hand Tools', slug: 'hand-tools', description: 'Manual tools for everyday jobs' },
  { name: 'Safety Equipment', slug: 'safety-equipment', description: 'Helmets, gloves, boots, and more' },
  { name: 'Building Materials', slug: 'building-materials', description: 'Cement, blocks, rods, and aggregates' },
  { name: 'Plumbing', slug: 'plumbing', description: 'Pipes, fittings, and plumbing accessories' },
  { name: 'Electrical', slug: 'electrical', description: 'Wires, switches, and electrical fittings' },
  { name: 'Paint & Coatings', slug: 'paint-and-coatings', description: 'Paints, primers, and coatings' },
  { name: 'Cleaning Supplies', slug: 'cleaning-supplies', description: 'Cleaning tools and chemicals' },
];

@Injectable()
export class ProductCategoryService implements OnModuleInit {
  constructor(private readonly categoryRepo: ProductCategoryRepository) {}

  async onModuleInit(): Promise<void> {
    await this.categoryRepo.findOrCreateDefaultCategories(DEFAULT_CATEGORIES);
  }

  async create(dto: CreateProductCategoryDto): Promise<ProductCategoryResponseDto> {
    const existing = await this.categoryRepo.findBySlug(dto.slug);
    if (existing) {
      throw new BadRequestException('Category with this slug already exists');
    }

    const category = await this.categoryRepo.create({
      name: dto.name,
      slug: dto.slug.toLowerCase(),
      description: dto.description,
      image: dto.image,
      isActive: dto.isActive ?? true,
    });

    return this.mapToDto(category);
  }

  async findAll(): Promise<ProductCategoryResponseDto[]> {
    const categories = await this.categoryRepo.findAllActive();
    return categories.map((c) => this.mapToDto(c));
  }

  async findAllAdmin(): Promise<ProductCategoryResponseDto[]> {
    const categories = await this.categoryRepo.findAll();
    return categories.map((c) => this.mapToDto(c));
  }

  async update(id: string, dto: UpdateProductCategoryDto): Promise<ProductCategoryResponseDto> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoryRepo.findBySlug(dto.slug);
      if (existing) {
        throw new BadRequestException('Category with this slug already exists');
      }
    }

    const updated = await this.categoryRepo.update(id, {
      name: dto.name,
      slug: dto.slug?.toLowerCase(),
      description: dto.description,
      image: dto.image,
      isActive: dto.isActive,
    });

    return this.mapToDto(updated!);
  }

  async delete(id: string): Promise<void> {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.categoryRepo.deleteById(id);
  }

  private mapToDto(category: ProductCategory): ProductCategoryResponseDto {
    return {
      _id: (category._id as any).toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      isActive: category.isActive,
      createdAt: category.createdAt ? new Date(category.createdAt).toISOString() : undefined,
      updatedAt: category.updatedAt ? new Date(category.updatedAt).toISOString() : undefined,
    };
  }
}
