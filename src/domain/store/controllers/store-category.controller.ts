import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductCategoryService } from '../services/product-category.service';
import { ProductCategoryResponseDto } from '../dtos/product-category.dto';
import { adaptResponse } from 'src/shared/adapters/response.adapter';

@ApiTags('Store Categories')
@Controller('v1/store/categories')
export class StoreCategoryController {
  constructor(private readonly categoryService: ProductCategoryService) {}

  @Get()
  @ApiOperation({ summary: 'List active product categories' })
  @ApiResponse({ type: [ProductCategoryResponseDto] })
  async findAll() {
    const docs = await this.categoryService.findAll();
    return adaptResponse(docs, 'Categories retrieved successfully');
  }
}
