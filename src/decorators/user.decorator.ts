import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const user = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return (req as any).user;
});
