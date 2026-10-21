import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { PaginatedResponse } from 'src/shared/dtos/pagination';
import { OrderService } from '../services/order.service';
import { OrderQueryDto, OrderResponseDto, RentalReservationResponseDto } from '../dtos/order.dto';
import { UserType } from 'src/domain/identity/enums/user-types.enum';

@ApiTags('Store Orders')
@Controller('v1/store/orders')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  private resolveUserType(currentUser: any): UserType {
    return currentUser.userType || UserType.HomeOwner;
  }

  @Get()
  @ApiOperation({ summary: 'List user orders' })
  @ApiResponse({ type: PaginatedResponse<OrderResponseDto> })
  async findAll(@user() currentUser: any, @Query() query: OrderQueryDto) {
    const result = await this.orderService.findByUser(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
      query,
    );
    return adaptResponse(result, 'Orders retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ type: OrderResponseDto })
  async findOne(@Param('id') id: string, @user() currentUser: any) {
    const doc = await this.orderService.findById(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
      id,
    );
    return adaptResponse(doc, 'Order retrieved successfully');
  }

  @Get(':id/rentals')
  @ApiOperation({ summary: 'List rental reservations for an order' })
  @ApiResponse({ type: [RentalReservationResponseDto] })
  async getRentals(@Param('id') id: string) {
    const docs = await this.orderService.getRentalReservations(id);
    return adaptResponse(docs, 'Rental reservations retrieved successfully');
  }

  @Post(':id/rentals/:reservationId/return')
  @ApiOperation({ summary: 'Request return of a rental item' })
  @ApiResponse({ type: RentalReservationResponseDto })
  async requestReturn(
    @Param('id') orderId: string,
    @Param('reservationId') reservationId: string,
    @user() currentUser: any,
  ) {
    const doc = await this.orderService.requestReturn(
      currentUser._id.toString(),
      this.resolveUserType(currentUser),
      orderId,
      reservationId,
    );
    return adaptResponse(doc, 'Return requested successfully');
  }
}
