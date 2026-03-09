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

// メンバーカラー（インデックスで固定割り当て）
const MEMBER_COLORS = [
  { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/40", ring: "ring-blue-500/30" },
  { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/40", ring: "ring-emerald-500/30" },
  { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/40", ring: "ring-purple-500/30" },
  { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/40", ring: "ring-amber-500/30" },
  { bg: "bg-rose-500/20", text: "text-rose-400", border: "border-rose-500/40", ring: "ring-rose-500/30" },
  { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/40", ring: "ring-cyan-500/30" },
  { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/40", ring: "ring-orange-500/30" },
  { bg: "bg-indigo-500/20", text: "text-indigo-400", border: "border-indigo-500/40", ring: "ring-indigo-500/30" },
] as const;

export function getMemberColor(index: number) {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}
