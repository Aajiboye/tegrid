import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { RequirePermissions } from 'src/decorators/require-permissions.decorator';
import { STORE_PERMISSIONS } from 'src/domain/identity/permissions/store-permissions';
import { ProductCategoryService } from '../services/product-category.service';
import { CreateProductCategoryDto, ProductCategoryResponseDto, UpdateProductCategoryDto } from '../dtos/product-category.dto';
import { adaptResponse } from 'src/shared/adapters/response.adapter';

@ApiTags('Admin Store Categories')
@Controller('v1/admin/store/categories')
export class AdminCategoryController {
  constructor(private readonly categoryService: ProductCategoryService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.MANAGE_CATEGORY)
  @ApiBody({ type: CreateProductCategoryDto })
  @ApiOperation({ summary: 'Create product category' })
  @ApiResponse({ type: ProductCategoryResponseDto })
  async create(@Body() dto: CreateProductCategoryDto) {
    const doc = await this.categoryService.create(dto);
    return adaptResponse(doc, 'Category created successfully');
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.MANAGE_CATEGORY)
  @ApiOperation({ summary: 'List all product categories' })
  @ApiResponse({ type: [ProductCategoryResponseDto] })
  async findAll() {
    const docs = await this.categoryService.findAllAdmin();
    return adaptResponse(docs, 'Categories retrieved successfully');
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.MANAGE_CATEGORY)
  @ApiBody({ type: UpdateProductCategoryDto })
  @ApiOperation({ summary: 'Update product category' })
  @ApiResponse({ type: ProductCategoryResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    const doc = await this.categoryService.update(id, dto);
    return adaptResponse(doc, 'Category updated successfully');
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.MANAGE_CATEGORY)
  @ApiOperation({ summary: 'Delete product category' })
  async delete(@Param('id') id: string) {
    await this.categoryService.delete(id);
    return adaptResponse(null, 'Category deleted successfully');
  }
}
