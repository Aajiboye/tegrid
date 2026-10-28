import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { PaginatedResponse } from 'src/shared/dtos/pagination';
import { NotificationService } from '../services/notification.service';
import {
  DeviceTokenResponseDto,
  NotificationResponseDto,
  RegisterDeviceTokenDto,
} from '../dtos/notification.dto';

@ApiTags('Notifications')
@Controller('v1/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('device-token')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Register a push notification device token' })
  @ApiResponse({ type: DeviceTokenResponseDto })
  async registerDeviceToken(
    @user() currentUser: any,
    @Body() body: RegisterDeviceTokenDto,
  ) {
    const token = await this.notificationService.registerDeviceToken(
      currentUser._id.toString(),
      currentUser.userType,
      body.token,
      body.provider || 'onesignal',
      body.platform,
    );
    return adaptResponse(token, 'Device token registered successfully');
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({ type: PaginatedResponse<NotificationResponseDto> })
  async getNotifications(
    @user() currentUser: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('unreadOnly') unreadOnly = 'false',
  ) {
    const notifications = await this.notificationService.getNotifications(
      currentUser._id.toString(),
      currentUser.userType,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
      unreadOnly === 'true',
    );
    return adaptResponse(notifications, 'Notifications retrieved successfully');
  }

  @Patch('read-all')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@user() currentUser: any) {
    await this.notificationService.markAllAsRead(
      currentUser._id.toString(),
      currentUser.userType,
    );
    return adaptResponse(null, 'All notifications marked as read');
  }

  @Patch(':id/read')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ type: NotificationResponseDto })
  async markAsRead(@user() currentUser: any, @Param('id') id: string) {
    const updated = await this.notificationService.markAsRead(
      id,
      currentUser._id.toString(),
      currentUser.userType,
    );
    return adaptResponse(updated, 'Notification marked as read');
  }
}
