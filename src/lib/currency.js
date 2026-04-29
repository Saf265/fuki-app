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

export function getCurrencyFromDomain(domain) {
  return VINTED_CURRENCY_MAP[domain] ?? "EUR";
}
