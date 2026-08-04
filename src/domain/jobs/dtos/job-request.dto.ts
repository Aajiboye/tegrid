import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, IsArray, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobRequestDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'Fix leaking sink', description: 'Short title for the job request' })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: 'The kitchen sink is leaking from under the cabinet', description: 'Detailed description of the job' })
  description: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional({ example: 5000, description: 'Budget in smallest currency unit or as number depending on integration' })
  budget?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'NGN', description: 'Currency code for the budget' })
  currency?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2026-08-10', description: 'Preferred date for the job (ISO date string)' })
  preferredDate?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '14:00', description: 'Preferred time for the job (HH:mm)' })
  preferredTime?: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '12 Baker Street, Lagos', description: 'Home address where the job will be performed' })
  homeAddress: string;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ example: ['https://.../photo1.jpg'], description: 'Optional list of photo URLs to help describe the job' })
  photos?: string[];

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ example: '632a7b...', description: 'JobType id' })
  jobTypeId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'PUBLIC', description: 'Visibility of the job: PUBLIC or PRIVATE' })
  visibility?: 'PUBLIC' | 'PRIVATE';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '62d3f4...', description: 'When visibility is PRIVATE, id of the tradesperson allowed to see the job' })
  tradespersonId?: string;
}

export class JobRequestResponseDto {
  _id: string;
  @ApiProperty({ example: 'Fix leaking sink' })
  title: string;
  @ApiProperty({ example: 'The kitchen sink is leaking from under the cabinet' })
  description: string;
  @ApiPropertyOptional({ example: 5000 })
  budget?: number;
  @ApiPropertyOptional({ example: 'NGN' })
  currency?: string;
  @ApiPropertyOptional({ example: '2026-08-10' })
  preferredDate?: string;
  @ApiPropertyOptional({ example: '14:00' })
  preferredTime?: string;
  @ApiProperty({ example: '12 Baker Street, Lagos' })
  homeAddress: string;
  @ApiProperty({ type: [String] })
  photos: string[];
  @ApiProperty({ example: 'PUBLIC' })
  visibility: string;
  @ApiProperty({ description: 'Populated JobType object' })
  jobType: any;
  @ApiProperty({ description: 'Minimal createdBy user object (id, phoneNumber, userType, userName)' })
  createdBy: any;
  @ApiPropertyOptional({ description: 'Tradesperson id for PRIVATE jobs' })
  tradespersonId?: string;
  @ApiProperty({ example: '2026-08-01T12:00:00.000Z' })
  createdAt: string;
}
