import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { FirebaseAuthService } from '../services/firebase-auth.service';
import { FirebaseTokenDto } from '../dtos/auth.payload.dto';
import { adaptResponse } from '../../../shared/adapters/response.adapter';

@ApiTags('Auth')
@Controller('v1/auth')
export class FirebaseAuthController {
  constructor(private readonly firebaseAuthService: FirebaseAuthService) {}

  @Post('firebase')
  @ApiOperation({ summary: 'Sign in with Firebase ID token (Google / Apple via Firebase)' })
  @ApiBody({ type: FirebaseTokenDto })
  @ApiResponse({ description: 'Login response', type: Object })
  async signIn(@Body() body: FirebaseTokenDto) {
    const res = await this.firebaseAuthService.signInWithFirebase(body.idToken);
    return adaptResponse(res);
  }
}