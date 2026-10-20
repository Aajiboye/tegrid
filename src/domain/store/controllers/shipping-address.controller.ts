import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { ShippingAddressService } from '../services/shipping-address.service';
import {
  CreateShippingAddressDto,
  ShippingAddressResponseDto,
  UpdateShippingAddressDto,
} from '../dtos/shipping-address.dto';
import { UserType } from 'src/domain/identity/enums/user-types.enum';

@ApiTags('Store Shipping Addresses')
@Controller('v1/store/shipping-addresses')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ShippingAddressController {
  constructor(private readonly addressService: ShippingAddressService) {}

  private resolveUserType(currentUser: any): UserType {
    return currentUser.userType || UserType.HomeOwner;
  }

  @Post()
  @ApiBody({ type: CreateShippingAddressDto })
  @ApiOperation({ summary: 'Create a shipping address' })
  @ApiResponse({ type: ShippingAddressResponseDto })
  async create(@Body() dto: CreateShippingAddressDto, @user() currentUser: any) {
    const doc = await this.addressService.create(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
      dto,
    );
    return adaptResponse(doc, 'Shipping address created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List user shipping addresses' })
  @ApiResponse({ type: [ShippingAddressResponseDto] })
  async findAll(@user() currentUser: any) {
    const docs = await this.addressService.findByUser(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
    );
    return adaptResponse(docs, 'Shipping addresses retrieved successfully');
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default shipping address' })
  @ApiResponse({ type: ShippingAddressResponseDto })
  async getDefault(@user() currentUser: any) {
    const doc = await this.addressService.getDefault(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
    );
    return adaptResponse(doc, 'Default shipping address retrieved successfully');
  }

  @Patch(':id')
  @ApiBody({ type: UpdateShippingAddressDto })
  @ApiOperation({ summary: 'Update a shipping address' })
  @ApiResponse({ type: ShippingAddressResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateShippingAddressDto,
    @user() currentUser: any,
  ) {
    const doc = await this.addressService.update(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
      id,
      dto,
    );
    return adaptResponse(doc, 'Shipping address updated successfully');
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set address as default' })
  @ApiResponse({ type: ShippingAddressResponseDto })
  async setDefault(@Param('id') id: string, @user() currentUser: any) {
    const doc = await this.addressService.setDefault(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
      id,
    );
    return adaptResponse(doc, 'Default shipping address updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shipping address' })
  async delete(@Param('id') id: string, @user() currentUser: any) {
    await this.addressService.delete(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
      id,
    );
    return adaptResponse(null, 'Shipping address deleted successfully');
  }
}
