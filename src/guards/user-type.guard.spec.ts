import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserTypeGuard } from './user-type.guard';
import { UserType } from '../domain/identity/enums/user-types.enum';
import { Role } from '../domain/identity/enums/roles.enum';

describe('UserTypeGuard', () => {
  let guard: UserTypeGuard;
  let reflector: Reflector;

  const createContext = (user: any, requiredUserType?: UserType): ExecutionContext => {
    const handler = jest.fn();
    if (requiredUserType) {
      Reflect.defineMetadata('userType', requiredUserType, handler);
    }
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => handler,
      getClass: () => ({} as any),
    } as any as ExecutionContext;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new UserTypeGuard(reflector);
  });

  it('should allow access when no user type is required', () => {
    const context = createContext({ userType: UserType.HomeOwner });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has the required user type', () => {
    const context = createContext(
      { userType: UserType.TradesPerson },
      UserType.TradesPerson,
    );

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user has a different user type', () => {
    const context = createContext(
      { userType: UserType.HomeOwner },
      UserType.TradesPerson,
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access when user is not authenticated', () => {
    const context = createContext(undefined, UserType.HomeOwner);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow root admin regardless of user type', () => {
    const context = createContext(
      { role: Role.Root, userType: UserType.HomeOwner },
      UserType.TradesPerson,
    );

    expect(guard.canActivate(context)).toBe(true);
  });
});
