
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSignedUrlDto {
  @ApiPropertyOptional({ description: 'Eager transformations string for Cloudinary' })
  eagerTransformations?: string;
}