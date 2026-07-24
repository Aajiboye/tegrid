import { CurrencyContext } from './currency-context.provider';

describe('CurrencyContext', () => {
  it('reads currency from request currencyContext', () => {
    const mockReq: any = { currencyContext: { country: 'NG', locale: 'en-NG', currency: 'NGN' } };
    const ctx = new CurrencyContext(mockReq as any);
    expect(ctx.country).toBe('NG');
    expect(ctx.locale).toBe('en-NG');
    expect(ctx.currency).toBe('NGN');
  });

  it('falls back to USD when no context present', () => {
    const mockReq: any = {};
    const ctx = new CurrencyContext(mockReq as any);
    expect(ctx.currency).toBe('USD');
  });
});
