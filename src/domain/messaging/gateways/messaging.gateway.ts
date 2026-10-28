import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { OnEvent } from '@nestjs/event-emitter';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../../../shared/services/token.service';
import { MessagingService } from '../services/messaging.service';
import { SendMessageDto, SendJobMessageDto } from '../dtos/message.dto';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      _id: string;
      email?: string;
      role?: string;
      userType?: string;
      permissions?: string[];
    };
  };
}

@WebSocketGateway({
  namespace: 'messages',
  cors: {
    origin: '*',
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagingService: MessagingService,
    private readonly tokenService: TokenService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const rawToken = client.handshake.auth?.token || client.handshake.query?.token;
      const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;
      if (!token || typeof token !== 'string') {
        return client.disconnect(true);
      }

      const user = this.tokenService.verifyToken(token) as any;
      if (!user || !user._id || !user.userType) {
        return client.disconnect(true);
      }

      client.data.user = user;
      const room = this.userRoom(user.userType, user._id.toString());
      await client.join(room);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user;
    if (user) {
      client.leave(this.userRoom(user.userType, user._id.toString()));
    }
  }

  private userRoom(userType: string, userId: string): string {
    return `${userType}:${userId}`;
  }

  @OnEvent('message.created')
  handleMessageCreated(payload: any) {
    const recipientRoom = this.userRoom(payload.recipientType, payload.recipient);
    this.server.to(recipientRoom).emit('new_message', payload);
  }

  @OnEvent('notification.created')
  handleNotificationCreated(payload: any) {
    const room = this.userRoom(payload.userType, payload.userId);
    this.server.to(room).emit('new_notification', payload);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const user = client.data.user;
    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const message = await this.messagingService.sendMessage(
      user._id.toString(),
      user.userType,
      payload.recipientId,
      payload.recipientType,
      payload.content,
    );

    client.emit('message_sent', message);
    return message;
  }

  @SubscribeMessage('send_job_message')
  async handleSendJobMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: SendJobMessageDto & { jobRequestId: string },
  ) {
    const user = client.data.user;
    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const message = await this.messagingService.sendJobMessage(
      user._id.toString(),
      user.userType,
      payload.recipientId,
      payload.recipientType,
      payload.jobRequestId,
      payload.content,
    );

    client.emit('message_sent', message);
    return message;
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { messageId: string },
  ) {
    const user = client.data.user;
    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    try {
      const message = await this.messagingService.markAsRead(
        payload.messageId,
        user._id.toString(),
      );
      client.emit('message_read', message);
      return message;
    } catch (error: any) {
      client.emit('error', { message: error.message || 'Failed to mark message as read' });
    }
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { userType: string; userId: string },
  ) {
    const user = client.data.user;
    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const room = this.userRoom(payload.userType, payload.userId);
    await client.join(room);
    client.emit('joined', { room });
  }
}
