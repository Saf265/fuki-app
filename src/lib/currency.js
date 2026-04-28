export const VINTED_CURRENCY_MAP = {
  "vinted.fr": "EUR",
  "vinted.be": "EUR",
  "vinted.lu": "EUR",
  "vinted.es": "EUR",
  "vinted.it": "EUR",
  "vinted.pt": "EUR",
  "vinted.nl": "EUR",
  "vinted.de": "EUR",
  "vinted.at": "EUR",
  "vinted.com": "USD",
  "vinted.co.uk": "GBP",
  "vinted.pl": "PLN",
  "vinted.cz": "CZK",
  "vinted.lt": "EUR",
  "vinted.se": "SEK",
};

export const EBAY_CURRENCY_MAP = {
  "EBAY_US": "USD",
  "EBAY_GB": "GBP",
  "EBAY_DE": "EUR",
  "EBAY_FR": "EUR",
  "EBAY_IT": "EUR",
  "EBAY_ES": "EUR",
  "EBAY_NL": "EUR",
  "EBAY_BE": "EUR",
  "EBAY_AT": "EUR",
  "EBAY_CA": "CAD",
  "EBAY_AU": "AUD",
};

export function getCurrencyFromDomain(domain) {
  return VINTED_CURRENCY_MAP[domain] ?? "EUR";
}

export function getCurrencyFromMarketplace(marketplaceId) {
  return EBAY_CURRENCY_MAP[marketplaceId] ?? "USD";
}
