import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AdminUserTypeFilter {
  ALL = 'ALL',
  HOME_OWNER = 'HOME_OWNER',
  TRADES_PERSON = 'TRADES_PERSON',
}

export enum KycApprovalFilter {
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  UNAPPROVED = 'UNAPPROVED',
}

export class AdminPaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ example: 1 })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @ApiPropertyOptional({ example: 20 })
  size?: number;
}

export class AdminKycSubmissionsQueryDto extends AdminPaginationQueryDto {
  @IsOptional()
  @IsEnum(AdminUserTypeFilter)
  @ApiPropertyOptional({ enum: AdminUserTypeFilter, default: AdminUserTypeFilter.ALL })
  userType?: AdminUserTypeFilter;

  @IsOptional()
  @IsEnum(KycApprovalFilter)
  @ApiPropertyOptional({ enum: KycApprovalFilter, default: KycApprovalFilter.PENDING })
  status?: KycApprovalFilter;
}

export class AdminVerifiedUsersQueryDto extends AdminPaginationQueryDto {
  @IsOptional()
  @IsEnum(AdminUserTypeFilter)
  @ApiPropertyOptional({ enum: AdminUserTypeFilter, default: AdminUserTypeFilter.ALL })
  userType?: AdminUserTypeFilter;
}

export class AdminKycSubmissionItemDto {
  @ApiProperty()
  kycId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: AdminUserTypeFilter })
  userType: AdminUserTypeFilter;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiPropertyOptional()
  rejectionReason?: string;

  @ApiPropertyOptional()
  submittedAt?: string;
}

export class AdminVerifiedUserItemDto {
  @ApiProperty()
  kycId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: AdminUserTypeFilter })
  userType: AdminUserTypeFilter;

  @ApiPropertyOptional()
  firstName?: string;

  @ApiPropertyOptional()
  lastName?: string;

  @ApiPropertyOptional()
  fullName?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiPropertyOptional()
  profileAvatar?: string;

  @ApiPropertyOptional()
  approvedAt?: string;
}

export class AdminLiveActivityItemDto {
  @ApiProperty({ example: 'QUOTATION_SUBMISSION' })
  action: string;

  @ApiPropertyOptional()
  actorFullName?: string;

  @ApiPropertyOptional({ example: 'TRADES_PERSON' })
  actorType?: string;

  @ApiProperty()
  time: string;

  @ApiPropertyOptional()
  details?: Record<string, any>;
}

export class AdminDashboardOverviewDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  activeJobs: number;

  @ApiProperty()
  pendingQuotes: number;

  @ApiProperty()
  pendingKyc: number;

  @ApiProperty({ description: 'Total revenue for today in minor units (kobo/cents)' })
  revenueToday: number;

  @ApiProperty()
  totalRentals: number;

  @ApiProperty({ type: [AdminLiveActivityItemDto] })
  liveActivityFeed: AdminLiveActivityItemDto[];
}
