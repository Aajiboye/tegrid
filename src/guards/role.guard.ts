import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Role } from '../domain/identity/enums/roles.enum';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly allowed: Role[] = [Role.Admin, Role.Root];

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user || !user.role) return false;
    return this.allowed.includes(user.role);
  }
}
