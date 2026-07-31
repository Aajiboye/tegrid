import { Controller, HttpCode, HttpStatus, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UnauthorizedException } from '@nestjs/common';
import { AdminService } from '../services/admin.service';
import { TokenService } from 'src/shared/services/token.service';
import { adaptResponse } from '../../../shared/adapters/response.adapter';
import { AdminLoginPayload } from '../dtos/admin.auth.dto';



@ApiTags('AdminAuth')
@Controller('v1/admin/auth')
export class AdminAuthController {
  constructor(private readonly adminService: AdminService, private readonly tokenService: TokenService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() payload: AdminLoginPayload) {
    const admin = await this.adminService.login(payload.email, payload.password);
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const token = this.tokenService.generateAccessToken({ email: admin.email, role: admin.role, _id: (admin as any)._id });
    return adaptResponse({ token, admin }, 'Login successful');
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('invite')
  async invite(@Body() body: { inviterId: string; email: string }) {
    const res = await this.adminService.inviteAdmin(body.inviterId, body.email);
    return adaptResponse(res, 'Invitation sent');
  }
}
