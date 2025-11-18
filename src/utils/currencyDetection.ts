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
    // PRIORITY 1: Try timezone-based detection (most reliable for actual location)
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('Timezone:', timeZone);
      
      // Map common African timezones
      const timezoneToCountry: Record<string, string> = {
        'Africa/Nairobi': 'KE',
        'Africa/Lagos': 'NG',
        'Africa/Johannesburg': 'ZA',
        'Africa/Cairo': 'EG',
        'Africa/Casablanca': 'MA',
      };
      
      for (const [tz, countryCode] of Object.entries(timezoneToCountry)) {
        if (timeZone?.includes(tz)) {
          const currencyCode = COUNTRY_TO_CURRENCY[countryCode];
          if (currencyCode) {
            const currency = CURRENCIES.find(c => c.code === currencyCode);
            console.log('Currency from timezone:', currency);
            if (currency) {
              return currency;
            }
          }
        }
      }
    } catch (timezoneError) {
      console.error('Timezone detection failed:', timezoneError);
    }
    
    // PRIORITY 2: Try to get country from browser locale
    const locale = navigator.language || 'en-US';
    console.log('Browser locale:', locale);
    
    const countryCode = locale.split('-')[1]?.toUpperCase();
    console.log('Extracted country code:', countryCode);
    
    if (countryCode && COUNTRY_TO_CURRENCY[countryCode]) {
      const currencyCode = COUNTRY_TO_CURRENCY[countryCode];
      const currency = CURRENCIES.find(c => c.code === currencyCode);
      console.log('Currency from locale mapping:', currency);
      if (currency) {
        return currency;
      }
    }
    
    // PRIORITY 3: Try to get currency from Intl
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'USD'
      });
      const userCurrency = formatter.resolvedOptions().currency;
      console.log('Currency from Intl:', userCurrency);
      
      const detectedCurrency = CURRENCIES.find(c => c.code === userCurrency);
      if (detectedCurrency) {
        return detectedCurrency;
      }
    } catch (intlError) {
      console.error('Intl detection failed:', intlError);
    }
    
  } catch (error) {
    console.error('Failed to detect currency from locale:', error);
  }
  
  console.log('Falling back to USD');
  // Default to USD if detection fails
  return CURRENCIES[0];
};
