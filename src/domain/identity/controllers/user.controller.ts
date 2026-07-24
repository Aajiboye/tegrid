// import {
//   Controller,
//   HttpCode,
//   HttpStatus,
//   Param,
//   Get,
//   UseGuards,
//   Put,
//   Body,
//   Query,
//   Delete,
// } from '@nestjs/common';
// import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
// import { User } from '../models/user.model';
// import { DeleteAccountDto, UpdateProfileDto } from '../dtos/user.dto';
// import { adaptResponse } from 'src/shared/response.adapter';



// @ApiTags('User')
// @Controller('v1/user')
// export class UserController {
//   constructor(private readonly service: UserService) {}

//   @HttpCode(HttpStatus.OK)
//   @Get('/:username')
//   async login(@Param('username') username: string) {
//     return adaptResponse(await this.service.getUserNameAvailability(username));
//   }

//   @HttpCode(HttpStatus.OK)
//   @Get('/profile/me')
//   @ApiBearerAuth()
//   @UseGuards(AuthGuard)
//   async getProfile(@user() user: User) {
//     return adaptResponse(await this.service.getProfile(user));
//   }

//   @HttpCode(HttpStatus.OK)
//   @Put('/profile')
//   @ApiBearerAuth()
//   @UseGuards(AuthGuard)
//   async updateProfile(@Body() payload: UpdateProfileDto, @user() user: User) {
//     return adaptResponse(await this.service.editProfile(payload, user));
//   }

//   @HttpCode(HttpStatus.OK)
//   @Get('/profile/search')
//   @ApiBearerAuth()
//   @UseGuards(AuthGuard)
//   async searchProfile(@Query('user') query: string) {
//     return adaptResponse(await this.service.searchProfile(query));
//   }

//   @Delete('/profile')
//   @ApiBearerAuth()
//   @UseGuards(AuthGuard)
//   @ApiOperation({ summary: 'Delete my account (soft-delete) with reason' })
//   @ApiBody({ type: DeleteAccountDto })
//   async deleteMyAccount(@user() currentUser: User, @Body() body: DeleteAccountDto) {
//     const res = await this.service.deleteMyAccount(currentUser, body?.reason ?? 'user_requested');
//     return adaptResponse(res);
//   }
// }
