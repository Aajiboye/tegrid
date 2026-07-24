import { Injectable } from '@nestjs/common';

@Injectable()
export class CurrencyService {
  private baseCurrency = 'USD';

  mapFromCountry(countryIso2?: string): string {
    // minimal mapping - can use shared util or extend
    if (!countryIso2) return this.baseCurrency;
    const map: Record<string, string> = {
      US: 'USD',
      GB: 'GBP',
      NG: 'NGN',
      FR: 'EUR',
      DE: 'EUR',
      CA: 'CAD',
      AU: 'AUD',
      JP: 'JPY',
      IN: 'INR',
    };
    return map[countryIso2.toUpperCase()] ?? this.baseCurrency;
  }

  format(amount: number, currencyCode: string, locale?: string) {
    try {
      const formatter = new Intl.NumberFormat(locale || 'en-US', {
        style: 'currency',
        currency: currencyCode,
      });
      // By default we treat amounts as minor units (cents) for backward
      // compatibility with existing data. To treat amounts as major units
      // (e.g., 9.99), set PRICE_IN_MINOR_UNITS=false in your environment.
      const minorUnits = process.env.PRICE_IN_MINOR_UNITS === undefined ? true : String(process.env.PRICE_IN_MINOR_UNITS).toLowerCase() !== 'false';
      const display = minorUnits ? Number(amount) / 100 : Number(amount);
      return formatter.format(display);
    } catch (e) {
      return `${currencyCode} ${amount}`;
    }
  }

  selectPriceFromProduct(product: any, desiredCurrency?: string) {
    if (!product) return null;
    const prices = product.prices || [];
    const key = desiredCurrency ? String(desiredCurrency).toUpperCase() : (product.currency || '').toUpperCase();
    if (Array.isArray(prices) && prices.length) {
      const found = prices.find((p: any) => String(p.currencyCode).toUpperCase() === key);
      if (found) return { amount: Number(found.amount), currency: String(found.currencyCode).toUpperCase() };
    }
    // fallback to product.minPrice/currency
    return { amount: Number(product.minPrice ?? 0), currency: (product.currency || 'USD').toUpperCase() };
  }
}
