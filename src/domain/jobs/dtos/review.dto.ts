import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  @ApiProperty({ example: 5, description: 'Rating from 1 to 5' })
  rating: number;

  @IsString()
  @IsOptional()
  @Length(0, 1000)
  @ApiPropertyOptional({ example: 'Great work, very professional!' })
  comment?: string;
}

export class ReviewResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  jobRequest: string;

  @ApiProperty()
  tradePerson: string;

  @ApiProperty()
  homeOwner: string;

  @ApiProperty({ example: 5 })
  rating: number;

  @ApiPropertyOptional()
  comment?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
