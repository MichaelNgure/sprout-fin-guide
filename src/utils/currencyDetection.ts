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
    
    // Fallback: try to get currency from Intl
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
    
    // Additional fallback: try timezone-based detection
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    console.log('Timezone:', timeZone);
    
    // Map timezone to likely currency (basic mapping for Kenya)
    if (timeZone?.includes('Nairobi') || timeZone?.includes('Africa/Nairobi')) {
      const kesCurrency = CURRENCIES.find(c => c.code === 'KES');
      console.log('Currency from timezone:', kesCurrency);
      if (kesCurrency) {
        return kesCurrency;
      }
    }
    
  } catch (error) {
    console.error('Failed to detect currency from locale:', error);
  }
  
  console.log('Falling back to USD');
  // Default to USD if detection fails
  return CURRENCIES[0];
};
