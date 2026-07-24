import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import mongoose from 'mongoose';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(): string {
    return this.appService.getHello();
  }

  @Get('db-health')
  getDbHealth() {
    // mongoose.connection.readyState
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const state = mongoose.connection.readyState;
    return { readyState: state };
  }
}
