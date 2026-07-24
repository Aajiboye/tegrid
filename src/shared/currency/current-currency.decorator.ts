import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentCurrency = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  return (req as any).currencyContext?.currency || 'USD';
});
