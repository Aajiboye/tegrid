import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { PaginatedResponse } from 'src/shared/dtos/pagination';
import {
  AdminDashboardOverviewDto,
  AdminKycSubmissionItemDto,
  AdminKycSubmissionsQueryDto,
  AdminVerifiedUserItemDto,
  AdminVerifiedUsersQueryDto,
} from '../dtos/admin-dashboard.dto';
import { AdminDashboardService } from '../services/admin-dashboard.service';

@ApiTags('Admin Dashboard')
@Controller('v1/admin/dashboard')
@UseGuards(AuthGuard, RoleGuard)
@ApiBearerAuth()
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('kyc-submissions')
  @ApiOperation({ summary: 'Admin: Fetch pending/unapproved KYC submissions across Trade Residents and Trade Persons' })
  @ApiResponse({ description: 'KYC submissions retrieved', type: PaginatedResponse<AdminKycSubmissionItemDto> as any })
  async getPendingKycSubmissions(@Query() query: AdminKycSubmissionsQueryDto) {
    const data = await this.dashboardService.getPendingKycSubmissions(query);
    return adaptResponse(data, 'KYC submissions retrieved successfully');
  }

  @Get('overview')
  @ApiOperation({ summary: 'Admin: Fetch dashboard overview metrics and live activity feed' })
  @ApiResponse({ description: 'Dashboard overview retrieved', type: AdminDashboardOverviewDto })
  async getOverview() {
    const data = await this.dashboardService.getDashboardOverview();
    return adaptResponse(data, 'Dashboard overview retrieved successfully');
  }

  @Get('verified-users')
  @ApiOperation({ summary: 'Admin: Fetch verified users across Trade Residents and Trade Persons' })
  @ApiResponse({ description: 'Verified users retrieved', type: PaginatedResponse<AdminVerifiedUserItemDto> as any })
  async getVerifiedUsers(@Query() query: AdminVerifiedUsersQueryDto) {
    const data = await this.dashboardService.getVerifiedUsers(query);
    return adaptResponse(data, 'Verified users retrieved successfully');
  }
}
