import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cloudinary from 'cloudinary';
import { CreateSignedUrlDto } from './dtos/cloudinary.dto';
import { SignedUrlParams } from './interfaces';

@Injectable()
export class CloudinaryService {
  cloudname: string;
  apiKey: string;
  apiSecret: string;
  constructor(private readonly configService: ConfigService) {
    this.cloudname = this.configService.getOrThrow<string>(
      'CLOUDINARY_CLOUD_NAME',
    );
    this.apiKey = this.configService.getOrThrow<string>('CLOUDINARY_API_KEY');
    this.apiSecret = this.configService.getOrThrow<string>(
      'CLOUDINARY_API_SECRET',
    );
    cloudinary.v2.config({
      cloud_name: this.cloudname,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  async generateSignedUrl(payload: CreateSignedUrlDto): Promise<any> {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const uploadPreset = this.configService.getOrThrow<string>(
      'CLOUDINARY_UPLOAD_PRESET',
    );
    const responseUrl =
      this.configService.getOrThrow<string>('CLOUDINARY_SIGNED_URL_RESPONSE');

    const params: SignedUrlParams = {
      timestamp,
      upload_preset: uploadPreset,
      folder: 'artsipify',
    };

    if (payload.eagerTransformations) {
      params.eager = payload.eagerTransformations;
    }
    const signature = cloudinary.v2.utils.api_sign_request(
      params,
      this.apiSecret,
    );
    return {
      timestamp,
      signature,
      url: responseUrl,
      key: this.apiKey,
      preset: uploadPreset,
      folder: params.folder,
      eager: params.eager,
    };
  }
}
