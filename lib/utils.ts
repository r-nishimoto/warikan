export function formatNumberWithCommas(value: string): string {
  const num = value.replace(/[^0-9.]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("ja-JP");
}

export function removeCommas(value: string): string {
  return value.replace(/,/g, "");
}

const CURRENCY_LOCALE_MAP: Record<string, string> = {
  JPY: "ja-JP",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  THB: "th-TH",
  KRW: "ko-KR",
  TWD: "zh-TW",
  AUD: "en-AU",
  CNY: "zh-CN",
};

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW"]);

export function formatCurrency(amount: number, currency: string = "JPY"): string {
  const locale = CURRENCY_LOCALE_MAP[currency] || "ja-JP";
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(currency);
  return amount.toLocaleString(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: isZeroDecimal ? 0 : 2,
    maximumFractionDigits: isZeroDecimal ? 0 : 2,
  });
}
