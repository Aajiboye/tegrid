import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionGuard } from './permission.guard';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { Role } from '../domain/identity/enums/roles.enum';

describe('PermissionGuard', () => {
  let guard: PermissionGuard;
  let reflector: Reflector;

  const createContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => ({} as any),
    }) as any as ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionGuard(reflector);
  });

  it('should allow access when no permissions are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createContext({ role: Role.User, permissions: [] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has all required permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['READ_PRODUCT', 'UPDATE_PRODUCT']);
    const context = createContext({
      role: Role.Admin,
      permissions: ['READ_PRODUCT', 'UPDATE_PRODUCT', 'DELETE_PRODUCT'],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user lacks a required permission', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['READ_PRODUCT', 'DELETE_PRODUCT']);
    const context = createContext({
      role: Role.Admin,
      permissions: ['READ_PRODUCT'],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow root admin regardless of permissions', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SUPER_SECRET_PERMISSION']);
    const context = createContext({
      role: Role.Root,
      permissions: [],
    });

    expect(guard.canActivate(context)).toBe(true);
  });
});
