import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/guards/auth.guard';
import { user } from 'src/decorators/user.decorator';
import { adaptResponse } from 'src/shared/adapters/response.adapter';
import { MessagingService } from '../services/messaging.service';
import { MarkMessageReadDto, MessageResponseDto, SendJobMessageDto, SendMessageDto } from '../dtos/message.dto';

@ApiTags('Messaging')
@Controller('v1')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('messages')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Send a general message to another user' })
  @ApiResponse({ description: 'Message sent', type: MessageResponseDto })
  async sendMessage(
    @user() currentUser: any,
    @Body() body: SendMessageDto,
  ) {
    const message = await this.messagingService.sendMessage(
      currentUser._id.toString(),
      currentUser.userType,
      body.recipientId,
      body.recipientType,
      body.content,
    );
    return adaptResponse(message, 'Message sent successfully');
  }

  @Post('jobs/:jobRequestId/messages')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Send a message related to a specific job' })
  @ApiResponse({ description: 'Job message sent', type: MessageResponseDto })
  async sendJobMessage(
    @user() currentUser: any,
    @Param('jobRequestId') jobRequestId: string,
    @Body() body: SendJobMessageDto,
  ) {
    const message = await this.messagingService.sendJobMessage(
      currentUser._id.toString(),
      currentUser.userType,
      body.recipientId,
      body.recipientType,
      jobRequestId,
      body.content,
    );
    return adaptResponse(message, 'Job message sent successfully');
  }

  @Get('jobs/:jobRequestId/messages')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List messages for a specific job' })
  @ApiResponse({ description: 'Job messages retrieved', type: [MessageResponseDto] })
  async getJobMessages(@Param('jobRequestId') jobRequestId: string) {
    const messages = await this.messagingService.getJobMessages(jobRequestId);
    return adaptResponse(messages, 'Job messages retrieved successfully');
  }

  @Get('messages/inbox')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List inbox messages for current user' })
  async getInbox(
    @user() currentUser: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const inbox = await this.messagingService.getInbox(
      currentUser._id.toString(),
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
    return adaptResponse(inbox, 'Inbox retrieved successfully');
  }

  @Get('messages/conversation/:otherUserId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List conversation between current user and another user' })
  async getConversation(
    @user() currentUser: any,
    @Param('otherUserId') otherUserId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const messages = await this.messagingService.getConversation(
      currentUser._id.toString(),
      otherUserId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20,
    );
    return adaptResponse(messages, 'Conversation retrieved successfully');
  }

  @Patch('messages/:messageId/read')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiResponse({ description: 'Message marked as read', type: MessageResponseDto })
  async markAsRead(
    @user() currentUser: any,
    @Param('messageId') messageId: string,
    @Body() body: MarkMessageReadDto,
  ) {
    const message = await this.messagingService.markAsRead(
      messageId,
      currentUser._id.toString(),
    );
    return adaptResponse(message, 'Message marked as read');
  }
}
