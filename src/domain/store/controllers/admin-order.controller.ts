import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { RequirePermissions } from 'src/decorators/require-permissions.decorator';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { PaginatedResponse } from 'src/shared/dtos/pagination';
import { STORE_PERMISSIONS } from 'src/domain/identity/permissions/store-permissions';
import { OrderService } from '../services/order.service';
import { AdminOrderQueryDto, OrderResponseDto, RentalReservationResponseDto } from '../dtos/order.dto';
import { AddTrackingUpdateDto, DeliveryTrackingResponseDto } from '../dtos/delivery-tracking.dto';

@ApiTags('Admin Store Orders')
@Controller('v1/admin/store/orders')
export class AdminOrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.MANAGE_ORDERS)
  @ApiOperation({ summary: 'List all orders' })
  @ApiResponse({ type: PaginatedResponse<OrderResponseDto> })
  async findAll(@Query() query: AdminOrderQueryDto) {
    const result = await this.orderService.findAllAdmin(query);
    return adaptResponse(result, 'Orders retrieved successfully');
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.MANAGE_ORDERS)
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponse({ type: OrderResponseDto })
  async findOne(@Param('id') id: string) {
    const doc = await this.orderService.findByIdAdmin(id);
    return adaptResponse(doc, 'Order retrieved successfully');
  }

  @Post(':id/tracking')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.MANAGE_ORDERS)
  @ApiBody({ type: AddTrackingUpdateDto })
  @ApiOperation({ summary: 'Add delivery tracking update' })
  @ApiResponse({ type: DeliveryTrackingResponseDto })
  async addTrackingUpdate(@Param('id') id: string, @Body() dto: AddTrackingUpdateDto) {
    const doc = await this.orderService.addTrackingUpdate(id, dto);
    return adaptResponse(doc, 'Tracking updated successfully');
  }

  @Post(':id/deliver')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.MANAGE_ORDERS)
  @ApiOperation({ summary: 'Mark order as delivered' })
  @ApiResponse({ type: OrderResponseDto })
  async markDelivered(@Param('id') id: string, @user() currentUser: any) {
    const doc = await this.orderService.markDelivered(id, currentUser._id.toString());
    return adaptResponse(doc, 'Order marked as delivered');
  }

  @Get(':id/rentals')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.MANAGE_ORDERS)
  @ApiOperation({ summary: 'List rental reservations for an order' })
  @ApiResponse({ type: [RentalReservationResponseDto] })
  async getRentals(@Param('id') id: string) {
    const docs = await this.orderService.getRentalReservations(id);
    return adaptResponse(docs, 'Rental reservations retrieved successfully');
  }

  @Post('rentals/:reservationId/confirm-return')
  @ApiBearerAuth()
  @UseGuards(AuthGuard, PermissionGuard)
  @RequirePermissions(STORE_PERMISSIONS.MANAGE_ORDERS)
  @ApiOperation({ summary: 'Confirm rental return' })
  @ApiResponse({ type: RentalReservationResponseDto })
  async confirmReturn(
    @Param('reservationId') reservationId: string,
    @user() currentUser: any,
  ) {
    const doc = await this.orderService.confirmReturn(reservationId, currentUser._id.toString());
    return adaptResponse(doc, 'Rental return confirmed successfully');
  }
}
