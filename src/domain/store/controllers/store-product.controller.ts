import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProductService } from '../services/product.service';
import { ProductQueryDto } from '../dtos/product-query.dto';
import { ProductListItemDto } from '../dtos/product.dto';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { PaginatedResponse } from 'src/shared/dtos/pagination';
import { CurrentCurrency } from 'src/shared/currency/current-currency.decorator';

@ApiTags('Store Products')
@Controller('v1/store/products')
export class StoreProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'List approved products with filters' })
  @ApiResponse({ type: PaginatedResponse<ProductListItemDto> })
  async findAll(
    @Query() query: ProductQueryDto,
    @CurrentCurrency() currency: string,
  ) {
    const result = await this.productService.findApprovedProducts(query, currency);
    return adaptResponse(result, 'Products retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get approved product details' })
  @ApiResponse({ type: ProductListItemDto })
  async findOne(
    @Param('id') id: string,
    @CurrentCurrency() currency: string,
  ) {
    const doc = await this.productService.findApprovedById(id, currency);
    return adaptResponse(doc, 'Product retrieved successfully');
  }
}
