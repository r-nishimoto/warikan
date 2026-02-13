export function formatNumberWithCommas(value: string): string {
  const num = value.replace(/[^0-9]/g, "");
  if (!num) return "";
  return Number(num).toLocaleString("ja-JP");
}

export function removeCommas(value: string): string {
  return value.replace(/,/g, "");
}

export function formatCurrency(amount: number, currency: string = "JPY"): string {
  return amount.toLocaleString("ja-JP", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
