import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { RequirePermissions } from 'src/decorators/require-permissions.decorator';
import { user } from 'src/decorators/user.decorator';
import { STORE_PERMISSIONS } from 'src/domain/identity/permissions/store-permissions';
import { ProductService } from '../services/product.service';
import {
  CreateProductDto,
  ProductResponseDto,
  ReviewProductDto,
  UpdateProductDto,
} from '../dtos/product.dto';
import { ProductQueryDto } from '../dtos/product-query.dto';
import { adaptResponse } from 'src/shared/adapters/response.adapter';

@ApiTags('Admin Store Products')
@Controller('v1/admin/store/products')
export class AdminProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.CREATE_PRODUCT)
  @ApiBody({ type: CreateProductDto })
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ type: ProductResponseDto })
  async create(@Body() dto: CreateProductDto, @user() currentUser: any) {
    const doc = await this.productService.create(currentUser._id.toString(), dto);
    return adaptResponse(doc, 'Product created successfully');
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.CREATE_PRODUCT)
  @ApiOperation({ summary: 'List all products (admin)' })
  async findAll(@Query() query: ProductQueryDto) {
    const result = await this.productService.findAllAdmin(query);
    return adaptResponse(result, 'Products retrieved successfully');
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.CREATE_PRODUCT)
  @ApiOperation({ summary: 'Get product details (admin)' })
  @ApiResponse({ type: ProductResponseDto })
  async findOne(@Param('id') id: string) {
    const doc = await this.productService.findByIdAdmin(id);
    return adaptResponse(doc, 'Product retrieved successfully');
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.UPDATE_PRODUCT)
  @ApiBody({ type: UpdateProductDto })
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({ type: ProductResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @user() currentUser: any,
  ) {
    const doc = await this.productService.update(currentUser._id.toString(), id, dto);
    return adaptResponse(doc, 'Product updated successfully');
  }

  @Post(':id/submit-approval')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.UPDATE_PRODUCT)
  @ApiOperation({ summary: 'Submit product for approval' })
  @ApiResponse({ type: ProductResponseDto })
  async submitForApproval(@Param('id') id: string) {
    const doc = await this.productService.submitForApproval(id);
    return adaptResponse(doc, 'Product submitted for approval');
  }

  @Post(':id/approve')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.APPROVE_PRODUCT)
  @ApiOperation({ summary: 'Approve a pending product' })
  @ApiResponse({ type: ProductResponseDto })
  async approve(
    @Param('id') id: string,
    @user() currentUser: any,
  ) {
    const doc = await this.productService.reviewProduct(currentUser._id.toString(), id, {
      status: 'APPROVED' as any,
    });
    return adaptResponse(doc, 'Product approved successfully');
  }

  @Post(':id/reject')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.APPROVE_PRODUCT)
  @ApiBody({ type: ReviewProductDto })
  @ApiOperation({ summary: 'Reject a pending product' })
  @ApiResponse({ type: ProductResponseDto })
  async reject(
    @Param('id') id: string,
    @Body() dto: ReviewProductDto,
    @user() currentUser: any,
  ) {
    const doc = await this.productService.reviewProduct(currentUser._id.toString(), id, dto);
    return adaptResponse(doc, 'Product rejected successfully');
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.UPDATE_PRODUCT)
  @ApiOperation({ summary: 'Archive a product' })
  @ApiResponse({ type: ProductResponseDto })
  async archive(@Param('id') id: string) {
    const doc = await this.productService.archiveProduct(id);
    return adaptResponse(doc, 'Product archived successfully');
  }
}
