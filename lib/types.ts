export interface Group {
  id: string;
  name: string;
  currency: string;
  members: Member[];
  expenses: Expense[];
  completedSettlements: string[]; // "fromId->toId" 形式
  createdAt: number;
  updatedAt: number;
}

export interface Member {
  id: string;
  name: string;
  preferredReceivingMethod?: ReceivingMethod;
  customReceivingMethod?: string; // "other" 選択時の自由入力テキスト
}

export type PaymentMethod = "cash" | "card" | "paypay" | "quickpay" | "other";

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "現金" },
  { value: "card", label: "カード" },
  { value: "paypay", label: "PayPay" },
  { value: "quickpay", label: "クイックペイ" },
  { value: "other", label: "その他" },
];

export interface Adjustment {
  memberIds: string[];  // 対象メンバーID
  amount: number;       // 符号付き金額（負=割引、正=追加）
  memo?: string;        // 例: "ノンアル"
}

// 割り勘方法
export type SplitMode = "equal" | "ratio" | "fixed";

export interface SplitConfig {
  mode: SplitMode;
  ratios?: Record<string, number>;       // memberId → 比率値 (ratio モード)
  fixedAmounts?: Record<string, number>;  // memberId → 固定額 (fixed モード)
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  paymentMethod: PaymentMethod;
  splitAmong: string[];
  expenseDate?: string; // YYYY-MM-DD形式（任意）
  date: number;
  adjustments?: Adjustment[];
  splitConfig?: SplitConfig;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

// 希望精算方法（受け取り側）
export type ReceivingMethod = "paypay" | "cash" | "bank" | "any" | "other";

export const RECEIVING_METHODS: { value: ReceivingMethod; label: string }[] = [
  { value: "any", label: "受取方法を選ぶ" },
  { value: "paypay", label: "PayPay" },
  { value: "cash", label: "現金" },
  { value: "bank", label: "振り込み" },
  { value: "other", label: "その他（自由入力）" },
];

// DB保存時のプレフィックス（"other:自由テキスト" 形式で1カラムに格納）
export const OTHER_PREFIX = "other:";

export function parseReceivingMethod(raw: string | null): { method: ReceivingMethod; custom?: string } {
  if (!raw || raw === "any") return { method: "any" };
  if (raw.startsWith(OTHER_PREFIX)) {
    return { method: "other", custom: raw.slice(OTHER_PREFIX.length) };
  }
  return { method: raw as ReceivingMethod };
}

export function encodeReceivingMethod(method: ReceivingMethod, custom?: string): string {
  if (method === "other" && custom?.trim()) {
    return OTHER_PREFIX + custom.trim();
  }
  return method;
}

// 端数処理
export type RoundingUnit = number;

export function getRoundingUnits(currency: string): { value: RoundingUnit; label: string }[] {
  const sym = getCurrencySymbol(currency);
  if (currency === "JPY" || currency === "KRW") {
    return [
      { value: 1, label: `1${sym}` },
      { value: 10, label: `10${sym}` },
      { value: 100, label: `100${sym}` },
      { value: 1000, label: `1000${sym}` },
    ];
  }
  return [
    { value: 0.01, label: `0.01${sym}` },
    { value: 0.1, label: `0.1${sym}` },
    { value: 1, label: `1${sym}` },
    { value: 10, label: `10${sym}` },
  ];
}

// 通貨
export interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { value: "JPY", label: "日本円 (¥)", symbol: "円" },
  { value: "USD", label: "米ドル ($)", symbol: "$" },
  { value: "EUR", label: "ユーロ (€)", symbol: "€" },
  { value: "GBP", label: "英ポンド (£)", symbol: "£" },
  { value: "THB", label: "タイバーツ (฿)", symbol: "฿" },
  { value: "KRW", label: "韓国ウォン (₩)", symbol: "₩" },
  { value: "TWD", label: "台湾ドル (NT$)", symbol: "NT$" },
  { value: "AUD", label: "豪ドル (A$)", symbol: "A$" },
  { value: "CNY", label: "人民元 (¥)", symbol: "元" },
];

export function getCurrencySymbol(currency: string): string {
  return CURRENCIES.find((c) => c.value === currency)?.symbol || currency;
}
