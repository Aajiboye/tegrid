import { IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString, IsArray, IsPositive } from 'class-validator';

export class CreateJobRequestDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  budget?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDateString()
  preferredDate?: string;

  @IsOptional()
  @IsString()
  preferredTime?: string;

  @IsNotEmpty()
  @IsString()
  homeAddress: string;

  @IsOptional()
  @IsArray()
  photos?: string[];

  @IsNotEmpty()
  @IsString()
  jobTypeId: string;

  @IsOptional()
  @IsString()
  visibility?: 'PUBLIC' | 'PRIVATE';

  @IsOptional()
  @IsString()
  tradespersonId?: string;
}

export class JobRequestResponseDto {
  _id: string;
  title: string;
  description: string;
  budget?: number;
  currency?: string;
  preferredDate?: string;
  preferredTime?: string;
  homeAddress: string;
  photos: string[];
  visibility: string;
  jobType: any;
  createdBy: any;
  tradespersonId?: string;
  createdAt: string;
}
