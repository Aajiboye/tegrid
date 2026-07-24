export function mapCountryToCurrency(countryIso2?: string): string | undefined {
  if (!countryIso2) return undefined;
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
    // extend as needed
  };
  return map[countryIso2.toUpperCase()];
}
