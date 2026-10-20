import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { CartService } from '../services/cart.service';
import { AddCartItemDto, CartResponseDto, UpdateCartItemDto } from '../dtos/cart.dto';
import { CurrentCurrency } from 'src/shared/currency/current-currency.decorator';
import { UserType } from 'src/domain/identity/enums/user-types.enum';

@ApiTags('Store Cart')
@Controller('v1/store/cart')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private resolveUserType(currentUser: any): UserType {
    return currentUser.userType || UserType.HomeOwner;
  }

  @Post('items')
  @ApiBody({ type: AddCartItemDto })
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ type: CartResponseDto })
  async addItem(
    @Body() dto: AddCartItemDto,
    @user() currentUser: any,
    @CurrentCurrency() currency: string,
  ) {
    const doc = await this.cartService.addItem(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
      dto,
      currency,
    );
    return adaptResponse(doc, 'Item added to cart successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  @ApiResponse({ type: CartResponseDto })
  async getCart(@user() currentUser: any) {
    const doc = await this.cartService.getCart(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
    );
    return adaptResponse(doc, 'Cart retrieved successfully');
  }

  @Patch('items/:itemId')
  @ApiBody({ type: UpdateCartItemDto })
  @ApiOperation({ summary: 'Update cart item' })
  @ApiResponse({ type: CartResponseDto })
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @user() currentUser: any,
  ) {
    const doc = await this.cartService.updateItem(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
      itemId,
      dto,
    );
    return adaptResponse(doc, 'Cart item updated successfully');
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ type: CartResponseDto })
  async removeItem(@Param('itemId') itemId: string, @user() currentUser: any) {
    const doc = await this.cartService.removeItem(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
      itemId,
    );
    return adaptResponse(doc, 'Item removed from cart successfully');
  }
}
