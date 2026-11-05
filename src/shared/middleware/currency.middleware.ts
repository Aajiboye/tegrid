import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { mapCountryToCurrency } from '../utils/country-to-currency';

declare global {
  namespace Express {
    interface Request {
      currencyContext?: {
        country?: string;
        locale?: string;
        currency?: string;
      };
    }
  }
}

@Injectable()
export class CurrencyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const explicitCurrency = String(req.header('x-user-currency') || '').trim();
    const location = String(req.header('x-user-location') || '').trim();

    const path = req.path || '';
    const requiresStrictCurrencyContext =
      path.startsWith('/v1/store/cart') || path.startsWith('/v1/store/checkout');

    if (requiresStrictCurrencyContext && !explicitCurrency && !location) {
      return res.status(400).json({
        message:
          'Currency context is required for cart/checkout. Provide x-user-currency or x-user-location header.',
        data: null,
      });
    }

    let country: string | undefined;
    let locale: string | undefined;
    if (location) {
      if (location.includes('-')) {
        locale = location;
        const parts = location.split('-');
        country = parts[1] ? parts[1].toUpperCase() : undefined;
      } else {
        country = location.toUpperCase();
      }
    }

    let currency = explicitCurrency ? explicitCurrency.toUpperCase() : undefined;
    if (!currency) {
      if (country) currency = mapCountryToCurrency(country);
    }
    if (!currency) currency = 'NGN';

    req.currencyContext = { country, locale, currency };
    next();
  }
}
