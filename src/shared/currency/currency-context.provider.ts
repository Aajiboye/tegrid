import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class CurrencyContext {
  country?: string;
  locale?: string;
  currency: string;

  constructor(@Inject(REQUEST) private readonly req: Request) {
    const ctx = (req as any).currencyContext || {};
    this.country = ctx.country;
    this.locale = ctx.locale;
    this.currency = ctx.currency || 'USD';
  }
}
