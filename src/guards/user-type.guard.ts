import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '../domain/identity/enums/user-types.enum';

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredUserType = this.reflector.get<UserType>('userType', context.getHandler()) ||
                            this.reflector.get<UserType>('userType', context.getClass());

    if (!requiredUserType) {
      return true; // No user type restriction
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.userType !== requiredUserType) {
      throw new ForbiddenException(`Access denied. This endpoint is only accessible to ${requiredUserType} users.`);
    }

    return true;
  }
}
