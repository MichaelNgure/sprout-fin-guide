import { CURRENCIES } from "@/contexts/CurrencyContext";

// Map of country codes to currency codes
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD',
  GB: 'GBP',
  EU: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  PT: 'EUR',
  IE: 'EUR',
  JP: 'JPY',
  IN: 'INR',
  CA: 'CAD',
  AU: 'AUD',
  CN: 'CNY',
  BR: 'BRL',
  ZA: 'ZAR',
  MX: 'MXN',
  CH: 'CHF',
  KR: 'KRW',
  SG: 'SGD',
  NZ: 'NZD',
  KE: 'KES',
};

export const detectCurrencyFromLocale = () => {
  try {
    // Try to get country from browser locale
    const locale = navigator.language || 'en-US';
    const countryCode = locale.split('-')[1]?.toUpperCase();
    
    if (countryCode && COUNTRY_TO_CURRENCY[countryCode]) {
      const currencyCode = COUNTRY_TO_CURRENCY[countryCode];
      const currency = CURRENCIES.find(c => c.code === currencyCode);
      if (currency) {
        return currency;
      }
    }
    
    // Fallback: try to detect from Intl.NumberFormat
    const userCurrency = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD'
    }).resolvedOptions().currency;
    
    const detectedCurrency = CURRENCIES.find(c => c.code === userCurrency);
    if (detectedCurrency) {
      return detectedCurrency;
    }
  } catch (error) {
    console.error('Failed to detect currency from locale:', error);
  }
  
  // Default to USD if detection fails
  return CURRENCIES[0];
};
